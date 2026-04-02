# AgenticSkill Services Map

เอกสารนี้แสดงแผนผังการเชื่อมต่อและการพึ่งพาอาศัยกัน (Dependencies) ของบริการ (Microservices) ทั้งหมดในระบบ AgenticSkill

## ภาพรวมสถาปัตยกรรม (Architecture Overview)

ระบบ AgenticSkill ประกอบด้วยบริการหลัก 13+ บริการที่ทำงานร่วมกันผ่าน HTTP API และ WebSocket โดยมี `openclaw` เป็น Gateway หลัก และ `antigravity-proxy` เป็นตัวจัดการการเข้าถึง LLM

### 1. Core Infrastructure
*   **`openclaw` (Port 18789):** Gateway หลักสำหรับการสื่อสารภายในระบบ
*   **`antigravity-proxy` (Port 8080):** Proxy สำหรับการเข้าถึง LLM พร้อม Fallback และ Load Balancing
*   **`redis` (Port 6379):** Cache และ Short-term/Shared Memory
*   **`chromadb` (Port 8000):** Vector Database สำหรับ Long-term Memory
*   **`ollama` (Port 11434):** Local LLM Server (ใช้สำหรับ Translation Layer)

### 2. Core Services
*   **`memory-system` (Port 3001):** บริการจัดการ Memory (Short/Long/Shared)
*   **`persistent-agent-layer` (Port 3002):** บริการจัดการ Persistent Agent
*   **`spawn-manager` (Port 3003):** บริการจัดการ Spawn-on-Demand Agent
*   **`translation-layer` (Port 3005):** บริการแปลภาษา
*   **`account-manager` (Port 3006):** บริการจัดการ LLM Account Rotation
*   **`monitoring` (Port 3008):** Monitoring Dashboard & Alerting

### 3. Agent Services
*   **`ceo-agent` (Port 3004):** บริการหลักของ CEO Agent (Planner/Tracker/Trend Research)
*   **`spawn-agents` (Port 3007):** Template สำหรับ Spawned Agents (13 ประเภท)
*   **`accountant-agent` (Port 3009):** Persistent Agent: เฝ้าระวังธุรกรรมการเงิน
*   **`cto-agent` (Port 3010):** Persistent Agent: ดูแลความเสถียรของระบบและ Error Logs
*   **`cmo-agent` (Port 3011):** Persistent Agent: จัดการแคมเปญการตลาดและงบประมาณ
*   **`cso-agent` (Port 3012):** Persistent Agent: วางกลยุทธ์ธุรกิจและวิเคราะห์คู่แข่ง
*   **`devops-agent` (Port 3013):** Persistent Agent: จัดการ Infrastructure และ CI/CD Pipelines

### 4. Interfaces
*   **`agent-town` (Port 3000):** UI สำหรับ Agent Town
*   **`discord-bot`:** Bot สำหรับการสื่อสารผ่าน Discord
*   **`telegram-bot`:** Bot สำหรับการสื่อสารผ่าน Telegram

---

## แผนผังการเชื่อมต่อ (Service Dependencies)

ตารางด้านล่างแสดงการพึ่งพาอาศัยกันของแต่ละบริการ (อ้างอิงจาก `docker-compose.yml`)

| Service | Port | Depends On (ต้องรันก่อน) | Communicates With (เรียกใช้ API) |
| :--- | :--- | :--- | :--- |
| `antigravity-proxy` | 8080 | - | `translation-layer` |
| `openclaw` | 18789 | `antigravity-proxy` | - |
| `agent-town` | 3000 | `openclaw` | `openclaw` (WebSocket) |
| `memory-system` | 3001 | `redis`, `chromadb` | - |
| `persistent-agent-layer` | 3002 | `redis`, `chromadb`, `openclaw` | - |
| `spawn-manager` | 3003 | `redis`, `chromadb`, `openclaw` | - |
| `ceo-agent` | 3004 | `memory-system`, `persistent-agent-layer`, `spawn-manager`, `translation-layer`, `account-manager`, `antigravity-proxy`, `openclaw` | - |
| `translation-layer` | 3005 | `ollama` | - |
| `account-manager` | 3006 | - | - |
| `spawn-agents` | 3007 | `antigravity-proxy`, `spawn-manager` | - |
| `monitoring` | 3008 | `memory-system`, `persistent-agent-layer`, `spawn-manager`, `ceo-agent`, `translation-layer`, `account-manager`, `spawn-agents`, `antigravity-proxy`, `accountant-agent`, `cto-agent`, `cmo-agent`, `cso-agent`, `devops-agent` | ทุก Service (ดึง Metrics) |
| `accountant-agent` | 3009 | `memory-system` | `memory-system` |
| `cto-agent` | 3010 | `spawn-manager`, `memory-system` | `spawn-manager`, `memory-system` |
| `cmo-agent` | 3011 | `spawn-manager`, `memory-system`, `antigravity-proxy` | `spawn-manager`, `memory-system`, `antigravity-proxy` |
| `cso-agent` | 3012 | `spawn-manager`, `memory-system`, `antigravity-proxy` | `spawn-manager`, `memory-system`, `antigravity-proxy` |
| `devops-agent` | 3013 | `memory-system` | `memory-system` |
| `discord-bot` | - | `openclaw` | - |
| `telegram-bot` | - | `openclaw` | - |

---

## Flow การทำงานที่สำคัญ

### 1. การประมวลผลคำสั่ง (Command Processing Flow)
1.  ผู้ใช้ส่งคำสั่งผ่าน `discord-bot` หรือ `telegram-bot`
2.  Bot ส่งคำสั่งไปยัง `openclaw` Gateway
3.  `openclaw` ส่งคำสั่งต่อไปยัง `ceo-agent`
4.  `ceo-agent` วิเคราะห์คำสั่งและวางแผนงาน
5.  `ceo-agent` สั่งการ `spawn-manager` เพื่อสร้าง Agent ที่เหมาะสม
6.  `spawn-manager` เรียกใช้ `spawn-agents` เพื่อสร้าง Instance ของ Agent
7.  Agent ทำงานโดยใช้ `antigravity-proxy` สำหรับ LLM และ `memory-system` สำหรับเก็บข้อมูล

### 2. การวิจัยเทรนด์ (Trend Research Flow)
1.  `ceo-agent` (Proactive Scheduler) เริ่มกระบวนการวิจัยเทรนด์ตามเวลาที่กำหนด
2.  `ceo-agent` (Trend Research Engine) ค้นหาข้อมูลและวิเคราะห์เทรนด์
3.  ข้อมูลถูกบันทึกลงใน `memory-system`
4.  `ceo-agent` (Daily Report Generator) สร้างรายงานสรุปประจำวัน
5.  รายงานถูกส่งไปยังผู้ใช้ผ่าน `discord-bot` หรือ `telegram-bot`

### 3. การตรวจสอบระบบ (Monitoring Flow)
1.  `monitoring` Service ดึงข้อมูล Metrics จากทุก Service เป็นระยะ
2.  หากพบความผิดปกติ (เช่น Error Rate สูง) จะส่ง Alert ไปยัง Webhook
3.  `cto-agent` ตรวจสอบ Error Logs จาก `memory-system`
4.  `cto-agent` สั่งการ `spawn-manager` เพื่อสร้าง Debugger Agent หรือ Tester Agent เพื่อแก้ไขปัญหา
