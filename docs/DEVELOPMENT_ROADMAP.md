# แผนงานการพัฒนา (Development Roadmap)

เอกสารนี้สรุปแผนงานการพัฒนาโปรเจกต์ Agentic Company โดยแบ่งออกเป็น Phase ต่างๆ เพื่อให้การพัฒนาเป็นไปอย่างมีระบบและสามารถติดตามความคืบหน้าได้ชัดเจน แผนงานนี้ได้รวมเอาแนวคิด Hybrid Agent System และ CEO Flow v3 เข้าไว้ด้วยกัน

## 1. หลักการสำคัญในการพัฒนา

*   **Modular Design:** ออกแบบและพัฒนาแต่ละส่วนประกอบให้เป็นอิสระต่อกัน เพื่อให้ง่ายต่อการบำรุงรักษาและขยายระบบ
*   **Iterative Development:** พัฒนาเป็นรอบๆ โดยมีการทดสอบและปรับปรุงอย่างต่อเนื่อง
*   **Scalability:** ออกแบบระบบให้สามารถรองรับการขยายตัวของจำนวน Agent และปริมาณงานในอนาคต
*   **Security First:** ให้ความสำคัญกับความปลอดภัยของข้อมูลและการสื่อสารตั้งแต่เริ่มต้น
*   **User-Centric:** มุ่งเน้นการสร้างประสบการณ์ที่ดีให้กับบอสและ Agent ในการใช้งานระบบ

## 2. Roadmap การพัฒนา

### Phase 1: Core Infrastructure & Persistent Agent Layer

**เป้าหมาย:** สร้างโครงสร้างพื้นฐานหลักของระบบและพัฒนา Persistent Agent Layer ให้สามารถทำงานได้

*   **ระยะเวลา:** 2-3 เดือน
*   **Task หลัก:**
    *   **Setup OpenClaw Gateway:** ติดตั้งและตั้งค่า OpenClaw Gateway ให้เป็น Hub กลาง
    *   **พัฒนา Persistent Agent Layer:** สร้าง Framework สำหรับ Persistent Agent (CEO, CTO, CMO, CSO, Accountant, DevOps Engineer)
    *   **Implement Memory System (Short-term):** ตั้งค่า Redis สำหรับ Short-term Memory ของ Agent
    *   **พัฒนา CEO Agent (Basic):** Implement CEO Agent ในเวอร์ชันพื้นฐานที่สามารถรับคำสั่งจากบอส (Telegram/TUI) และมอบหมายงานง่ายๆ ได้
    *   **พัฒนา Accountant Agent (Basic):** Implement Accountant Agent ที่สามารถเฝ้าระวังเงินเข้า-ออก และแจ้งเตือนผ่าน Discord ได้
    *   **เชื่อมต่อ Discord Bot:** พัฒนา Discord Bot และเชื่อมต่อกับ OpenClaw Gateway สำหรับการสื่อสารพื้นฐาน
    *   **เชื่อมต่อ Telegram Bot:** พัฒนา Telegram Bot และเชื่อมต่อกับ OpenClaw Gateway สำหรับการรับคำสั่งจากบอส
    *   **สร้าง UI Town (Basic):** พัฒนา UI Town ในเวอร์ชันพื้นฐานที่แสดงสถานะของ Persistent Agent และ Task Board เบื้องต้น
    *   **ตั้งค่า Antigravity Proxy (Basic):** ตั้งค่า Antigravity Proxy สำหรับการเชื่อมต่อกับ LLM Provider เดียว (ยังไม่มี Account Rotation)
    *   **ทดสอบระบบ Core:** ทดสอบการทำงานพื้นฐานของ OpenClaw Gateway, Persistent Agent, Discord/Telegram Bot

### Phase 2: Hybrid Agent System & Advanced Features

**เป้าหมาย:** พัฒนาระบบ Hybrid Agent System เต็มรูปแบบ, Implement Memory System ที่ซับซ้อนขึ้น, และเพิ่มฟังก์ชันการทำงานขั้นสูง

*   **ระยะเวลา:** 3-4 เดือน
*   **Task หลัก:**
    *   **พัฒนา Spawn Manager:** สร้างระบบ Spawn Manager สำหรับการสร้างและยุติ Spawn-on-Demand Agent
    *   **Implement Memory System (Long-term & Shared):** ตั้งค่า Vector DB (เช่น ChromaDB) สำหรับ Long-term Memory และ PostgreSQL สำหรับ Shared Memory
    *   **พัฒนา Spawn-on-Demand Agents:** พัฒนา Agent ประเภท Spawn-on-Demand (เช่น Frontend Dev, Backend Dev, Debugger, Software Tester, Designer, Copywriter, Researcher, Analyst, Hacker, RedTeam, Strategist)
    *   **พัฒนา CEO Agent (Advanced):** Implement CEO Agent ให้มีความสามารถในการตัดสินใจ 100% ระหว่างทำงาน, Proactive Trend Proposal, และ Sequential Task Completion Flow
    *   **พัฒนา Language Translation Layer:** Implement Translation Layer (อาจใช้ LLM หรือ Translation API) และเชื่อมต่อกับ Antigravity Proxy
    *   **พัฒนา Antigravity Proxy (Advanced):** Implement Account Rotation และ Load Balancing สำหรับ LLM Login Account Management (รองรับ 10-20 Google Account)
    *   **ทดสอบ LLM Account Switching:** วางแผนและดำเนินการทดสอบการสลับ Account จริงด้วย Gmail ที่เชื่อมต่อไว้
    *   **ปรับปรุง UI Town:** เพิ่มฟังก์ชันการแสดงผล Task ของ Spawned Agent, การสื่อสารระหว่าง Agent, และ Board ทำงาน
    *   **พัฒนา CTO Agent (Advanced):** Implement CTO Agent ให้สามารถดูแลระบบและสั่ง Spawn Debugger เมื่อมี Bug
    *   **พัฒนา Flow การทำงานทั้งหมด:** Implement Flow การทำงานต่างๆ (Dev Pipeline, Security, Marketing, Research, QA, DevOps)

### Phase 3: Optimization, Scaling & Production Readiness

**เป้าหมาย:** ปรับปรุงประสิทธิภาพ, ความเสถียร, ความปลอดภัย, และเตรียมระบบให้พร้อมสำหรับการใช้งานจริงในระยะยาว

*   **ระยะเวลา:** 2-3 เดือน
*   **Task หลัก:**
    *   **Performance Optimization:** ปรับปรุงประสิทธิภาพของ Agent, OpenClaw Gateway, และ Memory System
    *   **Scalability Testing:** ทดสอบความสามารถในการรองรับ Agent และ Task จำนวนมาก
    *   **Security Hardening:** ตรวจสอบและเสริมความปลอดภัยของระบบทั้งหมด (Penetration Testing, Vulnerability Assessment)
    *   **Monitoring & Alerting:** ตั้งค่าระบบ Monitoring และ Alerting ที่ครอบคลุมสำหรับทุกส่วนประกอบ
    *   **Error Handling & Resilience:** ปรับปรุงกลไกการจัดการ Error และความทนทานต่อความผิดพลาดของระบบ
    *   **Documentation:** จัดทำเอกสารประกอบการใช้งานและบำรุงรักษาอย่างละเอียด
    *   **User Feedback & Iteration:** รวบรวม Feedback จากบอสและ Agent เพื่อปรับปรุงระบบอย่างต่อเนื่อง
    *   **Deployment Automation:** ทำให้กระบวนการ Deploy ระบบเป็นไปโดยอัตโนมัติมากที่สุด

## 3. Open-Source Tools/Frameworks ที่แนะนำ

เพื่อการพัฒนาที่มีประสิทธิภาพและยืดหยุ่น สามารถพิจารณาใช้ Open-Source Tools/Frameworks ดังต่อไปนี้:

| ส่วนประกอบ | Open-Source Tools/Frameworks ที่แนะนำ |
| :--- | :--- |
| **Agent Orchestration** | CrewAI, AutoGen, LangGraph |
| **Message Broker / Task Queue** | Redis, Kafka, RabbitMQ |
| **Short-term Memory** | Redis |
| **Long-term Memory (Vector DB)** | ChromaDB, Pinecone, Weaviate, FAISS |
| **Long-term Memory (Relational DB)** | PostgreSQL, MySQL |
| **LLM Management / Proxy** | LiteLLM, OpenLLM |
| **UI Framework** | React, Vue, Svelte |
| **Backend Framework** | FastAPI, Flask, Node.js (Express) |
| **Discord Bot** | discord.py, discord.js |
| **Telegram Bot** | python-telegram-bot |
| **CI/CD** | GitHub Actions, GitLab CI/CD |
| **Containerization** | Docker, Kubernetes |
| **Monitoring** | Prometheus, Grafana, ELK Stack |
| **Translation** | LibreTranslate (Self-hosted), Google Cloud Translation API (Commercial) |

Roadmap นี้เป็นแนวทางเบื้องต้นที่สามารถปรับเปลี่ยนได้ตามความต้องการและผลลัพธ์ของการพัฒนาในแต่ละ Phase
