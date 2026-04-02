# Agentic Company Master Plan

## Project Full AutoAgentic

เอกสารนี้คือแผนแม่บทสำหรับการสร้างบริษัท AI Agent แบบ Full AutoAgentic ที่สามารถดำเนินงานได้อย่างอิสระ มีความสามารถในการตัดสินใจ, วางแผน, ดำเนินการ, และเรียนรู้จากประสบการณ์ เพื่อตอบสนองต่อคำสั่งของบอส (มนุษย์) และขับเคลื่อนการพัฒนาผลิตภัณฑ์/บริการอย่างต่อเนื่องและมีประสิทธิภาพสูงสุด

### 1. วิสัยทัศน์และเป้าหมาย

สร้างบริษัท AI Agent ที่สามารถดำเนินงานได้อย่างอิสระ มีความสามารถในการตัดสินใจ, วางแผน, ดำเนินการ, และเรียนรู้จากประสบการณ์ เพื่อตอบสนองต่อคำสั่งของบอส (มนุษย์) และขับเคลื่อนการพัฒนาผลิตภัณฑ์/บริการอย่างต่อเนื่องและมีประสิทธิภาพสูงสุด

### 2. โครงสร้างบริษัท Agent และหน้าที่

บริษัท Agentic จะจำลองโครงสร้างองค์กรจริง โดยมี AI Agent ทำหน้าที่เป็นพนักงานในตำแหน่งต่างๆ และมี CEO เป็นศูนย์กลางในการบริหารจัดการ Agent ทั้งหมดจะถูกแบ่งเป็น 2 ประเภทหลัก:

*   **Persistent Swarm Workers:** Agent หลักที่รันอยู่ตลอดเวลา 24/7 มี Memory ของตัวเอง และทำหน้าที่บริหารจัดการ, ตัดสินใจ, และเฝ้าระวังระบบ เช่น CEO, CTO, CMO, Accountant, DevOps Engineer
*   **Spawn-on-Demand Workers:** Agent ที่ถูกสร้างขึ้นมาเฉพาะกิจตาม Task และจะถูกทำลายเมื่อทำงานเสร็จสิ้น เพื่อประหยัดทรัพยากรและเพิ่มความยืดหยุ่น เช่น Frontend Developer, Backend Developer, Debugger, Software Tester, Designer, Copywriter, Researcher, Analyst, Hacker, RedTeam, Strategist

**CEO Agent** จะเป็นตัวกลางในการสื่อสารทั้งหมดระหว่างบอสและ Agent อื่นๆ โดยมีหน้าที่หลักในการรับคำสั่ง, วางแผน, มอบหมายงาน, ติดตามความคืบหน้า, และรายงานผลให้บอสทราบเท่านั้น Agent อื่นๆ จะไม่สามารถติดต่อบอสได้โดยตรง

### 3. สถาปัตยกรรมระบบ (ภาพรวม)

ระบบ Agentic จะถูกสร้างขึ้นบนพื้นฐานของ OpenClaw Gateway ที่ทำหน้าที่เป็น Hub กลางในการเชื่อมต่อและสื่อสารระหว่างส่วนประกอบต่างๆ โดยมี Antigravity Proxy สำหรับจัดการการเข้าถึง LLM และระบบ Memory ที่ซับซ้อนเพื่อรองรับ Persistent Agent

*   **OpenClaw Gateway:** Hub กลางในการเชื่อมต่อ Agent, UI Town, Discord, และ Telegram
*   **UI Town (Agent Town):** แพลตฟอร์ม UI สำหรับ Agent ในการทำงานร่วมกันและบอสใช้ติดตามสถานะ
*   **Discord Server:** ช่องทางการสื่อสารหลักระหว่าง Agent และการแจ้งเตือนต่างๆ
*   **Antigravity Proxy (BCProxyAI):** ระบบจัดการการเข้าถึง LLM พร้อมกลไก Account Rotation, Load Balancing และ Multi-provider Fallback
*   **Persistent Agent Layer:** ชั้นการทำงานสำหรับ Agent ถาวร พร้อม Agent Process Manager และ Memory/State Management
*   **Spawn Manager:** ระบบจัดการการสร้างและยุติ Spawn-on-Demand Workers ตาม Task
*   **Memory System:** ประกอบด้วย Short-term Memory (Redis), Long-term Memory (Vector DB), และ Shared Memory (Redis)
*   **Language Translation Layer:** ระบบแปลภาษาอัตโนมัติ (ไทย <-> อังกฤษ)
*   **LLM Account Manager:** บริการจัดการบัญชี LLM หลายบัญชี, Account Rotation, และ Health Check
*   **Monitoring & Alerting:** ระบบเฝ้าระวังสถานะของทุก Service พร้อม Dashboard และการแจ้งเตือนผ่าน Webhook

### 4. Flow การทำงานหลัก (สรุป)

1.  **Boss Command:** บอสส่งคำสั่งผ่าน Telegram หรือ Discord
2.  **CEO Ingestion & Planning:** CEO Agent รับคำสั่ง, วิเคราะห์ด้วย Task Planner (LLM), และสร้าง Execution Plan
3.  **Task Assignment:** CEO มอบหมาย Task ให้ Persistent Agent หรือสั่ง Spawn-on-Demand Worker ผ่าน Spawn Manager
4.  **Agent Execution:** Agent ดำเนินการตาม Task โดยใช้ LLM และ Tools ที่มี
5.  **Collaboration:** Agent สื่อสารและทำงานร่วมกันผ่าน Shared Memory และ Discord
6.  **Review & Debug:** งานที่เสร็จสิ้นจะถูกตรวจสอบและรายงานผล
7.  **Reporting to CEO:** Agent รายงานผลกลับไปยัง CEO
8.  **CEO Consolidation & Reporting to Boss:** CEO สรุปผลและรายงานให้บอสทราบผ่าน Progress Tracker

### 5. Roadmap การพัฒนา

*   **Phase 1: Core Infrastructure & Persistent Agent Layer:** สร้างรากฐานระบบและ Persistent Agent - **COMPLETED**
*   **Phase 2: Hybrid Agent System & Advanced Features:** ระบบ Hybrid Agent, Task Planning, และ Shared Memory - **COMPLETED**
*   **Phase 3: Optimization, Security & Production Readiness:** ระบบ Monitoring, Security Middleware, Resilience (Circuit Breaker/Retry), และ Error Handling - **COMPLETED**

### 6. Security & Resilience (Phase 3 Features)

ระบบใน Phase 3 ได้รับการอัปเกรดเพื่อความปลอดภัยและความเสถียรระดับ Production:
*   **API Key Authentication:** ทุก Service ต้องมีการตรวจสอบ API Key ก่อนเข้าถึง
*   **Rate Limiting:** ป้องกันการเรียกใช้งาน API เกินขีดจำกัด
*   **Circuit Breaker:** ป้องกันระบบล่มต่อเนื่องเมื่อ Service ปลายทางมีปัญหา
*   **Retry Mechanism:** ระบบพยายามเรียกใช้งานใหม่โดยอัตโนมัติเมื่อเกิดข้อผิดพลาดชั่วคราว
*   **Global Error Handling:** ระบบจัดการข้อผิดพลาดแบบรวมศูนย์และ Request Logging

### Quick Start (เริ่มต้นใช้งาน)

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/mrdarkpromth50-dotcom/agenticskill.git
    cd agenticskill
    ```

2.  **ตั้งค่า Environment Variables:**
    คัดลอกไฟล์ `.env.example` เป็น `.env` และแก้ไขค่าตัวแปรต่างๆ:
    ```bash
    cp docker/.env.example docker/.env
    ```
    ดูรายละเอียดตัวแปรทั้งหมดได้ในส่วน [Environment Variables Reference](#environment-variables-reference)

3.  **รันระบบด้วย Docker Compose:**
    ```bash
    chmod +x scripts/start-all.sh
    ./scripts/start-all.sh
    ```

4.  **ตรวจสอบสถานะ Health Check:**
    ```bash
    chmod +x scripts/health-check.sh
    ./scripts/health-check.sh
    ```

### Services และ Ports

| Service Name               | Port | Description                                                              |
| :------------------------- | :--- | :----------------------------------------------------------------------- |
| `agent-town`               | 3000 | UI สำหรับ Agent Town                                                      |
| `memory-system`            | 3001 | บริการจัดการ Memory (Short/Long/Shared)                                  |
| `persistent-agent-layer`   | 3002 | บริการจัดการ Persistent Agent                                            |
| `spawn-manager`            | 3003 | บริการจัดการ Spawn-on-Demand Agent                                       |
| `ceo-agent`                | 3004 | บริการหลักของ CEO Agent (Planner/Tracker/Trend Research)                 |
| `translation-layer`        | 3005 | บริการแปลภาษา                                                            |
| `account-manager`          | 3006 | บริการจัดการ LLM Account Rotation                                        |
| `spawn-agents`             | 3007 | Template สำหรับ Spawned Agents (Developer, Researcher, Designer, etc.)    |
| `monitoring`               | 3008 | Monitoring Dashboard & Alerting                                          |
| `accountant-agent`         | 3009 | Persistent Agent: เฝ้าระวังธุรกรรมการเงิน                                |
| `cto-agent`                | 3010 | Persistent Agent: ดูแลความเสถียรของระบบและ Error Logs                    |
| `cmo-agent`                | 3011 | Persistent Agent: จัดการแคมเปญการตลาดและงบประมาณ                         |
| `cso-agent`                | 3012 | Persistent Agent: วางกลยุทธ์ธุรกิจและวิเคราะห์คู่แข่ง                    |
| `devops-agent`             | 3013 | Persistent Agent: จัดการ Infrastructure และ CI/CD Pipelines              |
| `antigravity-proxy`        | 8080 | Proxy สำหรับการเข้าถึง LLM พร้อม Fallback และ Load Balancing             |
| `openclaw`                 | 18789| Gateway สำหรับการสื่อสารภายในระบบ                                        |
| `redis`                    | 6379 | Redis Cache/DB สำหรับ Short-term Memory และ Shared Memory                |
| `chromadb`                 | 8000 | Vector Database สำหรับ Long-term Memory                                   |
| `ollama`                   | 11434| Local LLM Server (ใช้สำหรับ Translation Layer หรือ Antigravity Proxy)   |

### การตรวจสอบ Monitoring Dashboard

คุณสามารถเข้าถึง Dashboard เพื่อดูสถานะของระบบและ Metrics ต่างๆ ได้ที่:
`http://localhost:3008/dashboard`

### Environment Variables Reference

โปรดดูไฟล์ `docker/.env.example` สำหรับรายการ Environment Variables ทั้งหมดที่จำเป็นสำหรับการตั้งค่าระบบ พร้อมคำอธิบายและค่าตัวอย่าง

### เอกสารประกอบ

รายละเอียดเพิ่มเติมสามารถดูได้จากเอกสารในโฟลเดอร์ `docs/` และไฟล์ Markdown อื่นๆ ใน Project Root:
*   `DEVELOPMENT_ROADMAP.md`
*   `CHANGELOG.md`
*   `SERVICES_MAP.md`
