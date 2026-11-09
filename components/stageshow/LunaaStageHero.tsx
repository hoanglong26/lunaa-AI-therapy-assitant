"use client";

import {
  Bar,
  Collapse,
  Field,
  Stage,
  Stream,
  Text,
  Window,
  type Act,
} from "./kit";
import "./lunaa-stage.css";

const Q = "Dạo này mình hay thức giấc lúc 3 giờ sáng vì lo nghĩ công việc.";
const A =
  "Mình hiểu cảm giác trằn trọc đó. Tuần trước bạn cũng từng nhắc đến áp lực từ dự án mới. Hãy hít thở thật chậm — tối nay điều gì đang đè nặng lên tâm trí bạn nhất?";
const WORDS = A.split(" ").length;

type SceneState = {
  draft: string;
  sent: boolean;
  phase: "idle" | "thinking" | "answer";
  words: number;
  sources: boolean;
};

const initial: SceneState = {
  draft: "",
  sent: false,
  phase: "idle",
  words: 0,
  sources: false,
};

const poster: SceneState = {
  draft: "",
  sent: true,
  phase: "answer",
  words: WORDS,
  sources: true,
};

async function script(a: Act<SceneState>) {
  await a.wait(650);
  a.mark("type");
  await a.type("draft", Q, { interval: 32 });
  await a.wait(380);
  a.mark("send");
  a.put({ sent: true, draft: "" });
  await a.wait(420);
  a.put({ phase: "thinking" });
  await a.wait(950);
  a.mark("stream");
  a.put({ phase: "answer" });
  for (let i = 1; i <= WORDS; i++) {
    a.put({ words: i });
    await a.wait(38);
  }
  await a.wait(280);
  a.mark("sources");
  a.put({ sources: true });
  await a.wait(3200);
}

export default function LunaaStageHero() {
  return (
    <div className="w-full max-w-[640px] mx-auto">
      <Stage
        width={640}
        height={390}
        compact={{ below: 560, width: 358, height: 420 }}
        theme="dark"
        initial={initial}
        poster={poster}
        script={script}
        play="loop"
        className="lunaa-stage-wrap"
      >
        {(s) => (
          <Window title="Luna — Không gian lắng nghe" className="lunaa-win">
            <div className="lunaa-win-body">
              <div className="lunaa-thread">
                <div className="lunaa-turn--past">
                  <Bar w={164} h={28} r={14} tone={1} className="lunaa-past-q" />
                  <Bar w="84%" h={7} r={3.5} tone={2} />
                  <Bar w="58%" h={7} r={3.5} tone={2} />
                </div>

                <Collapse open={s.sent} reveal="drop" from="below">
                  <div className="lunaa-q">
                    <Text>{Q}</Text>
                  </div>
                </Collapse>

                <Collapse open={s.phase === "thinking"}>
                  <Text className="lunaa-thinking">
                    Đang lắng nghe và liên kết ký ức...
                  </Text>
                </Collapse>

                <Collapse open={s.phase === "answer"}>
                  <div className="lunaa-a" data-on>
                    <Stream className="lunaa-stream" text={A} count={s.words} />
                    <div
                      className="lunaa-sources"
                      data-on={s.sources || undefined}
                    >
                      <span className="lunaa-source lunaa-source--accent">
                        Ký ức liên kết • Phiên #04
                      </span>
                      <span className="lunaa-source">Nhịp ngủ & Áp lực</span>
                    </div>
                  </div>
                </Collapse>
              </div>

              <Field
                className="lunaa-composer"
                value={s.draft}
                placeholder="Chia sẻ điều bạn đang cảm nhận..."
                focused={!s.sent}
              />
            </div>
          </Window>
        )}
      </Stage>
    </div>
  );
}
