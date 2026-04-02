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
*   **Antigravity Proxy:** ระบบจัดการการเข้าถึง LLM (Opus 4.6 Think, Gemini 3 Pro High) พร้อมกลไก Account Rotation และ Load Balancing สำหรับ Google Account จำนวน 10-20 บัญชี
*   **Persistent Agent Layer:** ชั้นการทำงานสำหรับ Agent ถาวร พร้อม Agent Process Manager และ Memory/State Management
*   **Spawn Manager:** ระบบจัดการการสร้างและยุติ Spawn-on-Demand Workers ตาม Task
*   **Memory System:** ประกอบด้วย Short-term Memory (Redis), Long-term Memory (Vector DB/PostgreSQL), และ Shared Memory (Redis/Message Queue) เพื่อให้ Agent มีความจำและบริบทที่ต่อเนื่อง
*   **Language Translation Layer:** ระบบแปลภาษาอัตโนมัติ (ไทย <-> อังกฤษ) สำหรับการสื่อสารกับ LLM Provider และบอส
*   **LLM Account Manager:** บริการจัดการบัญชี LLM หลายบัญชี, Account Rotation, และ Health Check

### 4. Flow การทำงานหลัก (สรุป)

1.  **Boss Command:** บอสส่งคำสั่งผ่าน Telegram หรือ TUI CLI OpenClaw
2.  **CEO Ingestion & Planning:** CEO Agent รับคำสั่ง, วิเคราะห์, วางแผน, และสร้าง Roadmap
3.  **Task Assignment:** CEO มอบหมาย Task ให้ Persistent Agent หรือสั่ง Spawn-on-Demand Worker ผ่าน Spawn Manager
4.  **Agent Execution:** Agent ดำเนินการตาม Task โดยใช้ LLM และ Tools ที่มี
5.  **Collaboration:** Agent สื่อสารและทำงานร่วมกันผ่าน Discord และ UI Town
6.  **Review & Debug:** งานที่เสร็จสิ้นจะถูกตรวจสอบ, หาบัค, และแก้ไข
7.  **Reporting to CEO:** Agent รายงานผลกลับไปยัง CEO
8.  **CEO Consolidation & Reporting to Boss:** CEO สรุปผลและรายงานให้บอสทราบ (เฉพาะงานที่เสร็จสมบูรณ์)

### 5. Roadmap การพัฒนา (สรุป)

การพัฒนาจะแบ่งออกเป็น 3 Phase หลัก:

*   **Phase 1: Core Infrastructure & Persistent Agent Layer:** เน้นการสร้างรากฐานสำหรับ Agent ถาวรและระบบความจำ
*   **Phase 2: Hybrid Agent System & Advanced Features:** พัฒนาระบบ Hybrid Agent System เต็มรูปแบบ, Implement Memory System ที่ซับซ้อนขึ้น, และเพิ่มฟังก์ชันการทำงานขั้นสูง
*   **Phase 3: Optimization, Scaling & Production Readiness:** ปรับปรุงประสิทธิภาพ, ความเสถียร, ความปลอดภัย, และเตรียมระบบให้พร้อมสำหรับการใช้งานจริงในระยะยาว

### 6. Open-Source ที่แนะนำ (สรุป)

จะมีการนำ Open-Source Tools และ Frameworks ต่างๆ มาประยุกต์ใช้ เช่น LangGraph, CrewAI/AutoGen สำหรับ Agent Frameworks; Redis, ChromaDB, PostgreSQL สำหรับ Memory & Database; PM2, RabbitMQ/Kafka สำหรับ Process Management; และ LiteLLM/LiteLLM Proxy สำหรับ LLM Proxy & Load Balancing

### 7. LLM Login Account Management & Gmail Testing

ระบบจะมีการจัดการบัญชี Google Account จำนวน 10-20 บัญชี สำหรับการเข้าถึง LLM ผ่าน Antigravity Proxy ด้วยกลไก Account Rotation และ Load Balancing เพื่อหลีกเลี่ยง Rate Limit และเพิ่มความเสถียร

มีการวางแผนทดสอบการสลับ Account จริงโดยใช้ Gmail ที่เชื่อมต่อไว้ เพื่อตรวจสอบการ Login, Account Switching, การจัดการ Rate Limiting และ Error Handling

### Quick Start (เริ่มต้นใช้งาน)

เพื่อเริ่มต้นระบบ Agentic Company บนเครื่อง Local ของคุณ:

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/mrdarkpromth50-dotcom/agenticskill.git
    cd agenticskill
    ```

2.  **ตั้งค่า Environment Variables:**
    คัดลอกไฟล์ `.env.example` เป็น `.env` และแก้ไขค่าตัวแปรต่างๆ ให้ถูกต้อง:
    ```bash
    cp .env.example .env
    # แก้ไข .env ด้วยข้อมูลของคุณ (เช่น Discord/Telegram Tokens, LLM API Keys)
    ```

3.  **สร้าง Agent Profiles และ Skill Definitions:**
    รันสคริปต์เพื่อสร้างไฟล์คอนฟิกูเรชัน Agent และ Skill:
    ```bash
    chmod +x scripts/setup-agents.sh
    ./scripts/setup-agents.sh
    ```

4.  **รันระบบด้วย Docker Compose:**
    สร้างและรันบริการทั้งหมดโดยใช้ Docker Compose:
    ```bash
    docker-compose -f docker/docker-compose.yml up --build -d
    ```

5.  **เข้าถึง UI Town:**
    เมื่อระบบทำงานแล้ว คุณสามารถเข้าถึง UI Town ได้ที่ `http://localhost:3000`

### เอกสารประกอบ

รายละเอียดเพิ่มเติมสามารถดูได้จากเอกสารในโฟลเดอร์ `docs/`:

*   `docs/MASTER_PLAN.md`: แผนแม่บทบริษัท Agentic ฉบับเต็ม
*   `docs/ARCHITECTURE.md`: สถาปัตยกรรมระบบ Agentic Hybrid โดยละเอียด
*   `docs/CEO_FLOW.md`: Flow การทำงานของ CEO Agent และโปรโตคอลการสื่อสาร
*   `docs/AGENT_ROLES.md`: โครงสร้างบริษัทและบทบาทของ Agent แต่ละตำแหน่ง
*   `docs/DISCORD_SETUP.md`: การตั้งค่า Discord Server สำหรับ Agentic Company
*   `docs/DEVELOPMENT_ROADMAP.md`: แผนงานการพัฒนาโดยละเอียด
*   `TESTING_PLAN.md`: แผนการทดสอบระบบทั้งหมด
