import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import { embed, embedMany } from 'ai';
import { google } from '@ai-sdk/google';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from lunaa-app root
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'lunaa-knowledge';
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

if (!PINECONE_API_KEY) {
  console.error('❌ Thiếu PINECONE_API_KEY trong .env.local');
  process.exit(1);
}
if (!GOOGLE_API_KEY) {
  console.error('❌ Thiếu GOOGLE_GENERATIVE_AI_API_KEY trong .env.local');
  process.exit(1);
}

const CSV_PATH = path.resolve(__dirname, '../app/api/knowledge/data.csv');
const CHECKPOINT_FILE = path.resolve(__dirname, '.import-checkpoint.json');
const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES_MS = 600;

function parseCSV(text) {
  const records = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i++;
        }
        row.push(field);
        field = '';
        if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
          records.push(row);
        }
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  const headers = records[0].map(h => h.trim());
  return records.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] || '';
    });
    return obj;
  });
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
      return new Set(data.completedIds || []);
    } catch {
      return new Set();
    }
  }
  return new Set();
}

function saveCheckpoint(completedIdsSet) {
  fs.writeFileSync(
    CHECKPOINT_FILE,
    JSON.stringify({ completedIds: Array.from(completedIdsSet), lastUpdated: new Date().toISOString() }, null, 2),
    'utf-8'
  );
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Lấy embeddings có retry với exponential backoff
async function getEmbeddingsWithRetry(texts, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { embeddings } = await embedMany({
        model: google.embedding('gemini-embedding-001'),
        values: texts,
      });
      return embeddings;
    } catch (err) {
      console.warn(`  ⚠️ Lỗi khi gọi Embedding API (lần thử ${attempt}/${retries}): ${err.message}`);
      if (attempt === retries) {
        // Fallback: Thử gọi từng text đơn lẻ
        console.log('  🔄 Thử chế độ fallback từng embedding riêng lẻ...');
        const singleEmbeddings = [];
        for (const text of texts) {
          const { embedding } = await embed({
            model: google.embedding('gemini-embedding-001'),
            value: text,
          });
          singleEmbeddings.push(embedding);
          await sleep(150);
        }
        return singleEmbeddings;
      }
      await sleep(1500 * attempt);
    }
  }
}

async function main() {
  console.log('========================================================');
  console.log('🚀 BẮT ĐẦU IMPORT TRI THỨC VÀO PINECONE');
  console.log('========================================================');
  console.log(`- Index: ${PINECONE_INDEX}`);
  console.log(`- Namespace: Default ("")`);
  console.log(`- CSV File: ${CSV_PATH}`);
  console.log(`- Batch Size: ${BATCH_SIZE}`);

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ Không tìm thấy file CSV tại: ${CSV_PATH}`);
    process.exit(1);
  }

  const rawCSV = fs.readFileSync(CSV_PATH, 'utf-8');
  const allRecords = parseCSV(rawCSV);
  console.log(`📄 Đã đọc tổng cộng ${allRecords.length} bản ghi từ data.csv`);

  const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = pc.index(PINECONE_INDEX);

  // Đọc checkpoint cũ nếu có
  const completedIds = loadCheckpoint();
  if (completedIds.size > 0) {
    console.log(`⏩ Tìm thấy checkpoint: Đã nạp trước đó ${completedIds.size} bản ghi. Sẽ bỏ qua các bản ghi này.`);
  }

  const pendingRecords = allRecords.filter(r => !completedIds.has(r._id));
  console.log(`📋 Cần xử lý tiếp: ${pendingRecords.length} / ${allRecords.length} bản ghi\n`);

  if (pendingRecords.length === 0) {
    console.log('✅ Toàn bộ dữ liệu đã được nạp đầy đủ vào Pinecone từ trước!');
    return;
  }

  const totalBatches = Math.ceil(pendingRecords.length / BATCH_SIZE);
  let processedCount = completedIds.size;
  const startTime = Date.now();

  for (let i = 0; i < pendingRecords.length; i += BATCH_SIZE) {
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
    const batch = pendingRecords.slice(i, i + BATCH_SIZE);

    console.log(`⏳ [Batch ${batchIndex}/${totalBatches}] Đang tạo vector cho ${batch.length} bản ghi (${batch[0]._id} -> ${batch[batch.length - 1]._id})...`);

    const texts = batch.map(b => b.text);
    const vectors = await getEmbeddingsWithRetry(texts);

    const pineconeRecords = batch.map((item, idx) => ({
      id: item._id,
      values: vectors[idx],
      metadata: {
        text: item.text,
        source: item.source || 'Tài liệu tâm lý Lunaa',
        type: 'clinical_knowledge',
        importedAt: new Date().toISOString(),
      },
    }));

    // Upsert vào Pinecone với cơ chế retry
    let upsertSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await index.upsert({ records: pineconeRecords });
        upsertSuccess = true;
        break;
      } catch (upsertErr) {
        console.warn(`  ⚠️ Lỗi khi upsert vào Pinecone (lần thử ${attempt}/3): ${upsertErr.message}`);
        if (attempt === 3) throw upsertErr;
        await sleep(2000 * attempt);
      }
    }

    if (upsertSuccess) {
      batch.forEach(item => completedIds.add(item._id));
      saveCheckpoint(completedIds);
      processedCount += batch.length;

      const percent = Math.round((processedCount / allRecords.length) * 100);
      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ [Batch ${batchIndex}/${totalBatches}] Thành công! Tiến độ: ${processedCount}/${allRecords.length} (${percent}%) - Thời gian: ${elapsedSec}s`);
    }

    if (i + BATCH_SIZE < pendingRecords.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  // Xóa checkpoint khi hoàn tất toàn bộ 100%
  if (completedIds.size === allRecords.length && fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }

  // Kiểm tra thống kê Pinecone
  console.log('\n========================================================');
  console.log('🎉 IMPORT HOÀN TẤT THÀNH CÔNG 100%!');
  console.log('========================================================');
  try {
    const stats = await index.describeIndexStats();
    console.log('📊 Thống kê Pinecone Index hiện tại:');
    console.log(`- Tổng số vector: ${stats.totalRecordCount}`);
    console.log(`- Namespaces:`, stats.namespaces || {});
  } catch (statErr) {
    console.log(`- Đã cập nhật xong tất cả ${allRecords.length} bản ghi.`);
  }
}

main().catch(err => {
  console.error('\n❌ Xảy ra lỗi nghiêm trọng trong quá trình import:', err);
  process.exit(1);
});
