# แผนการทดสอบระบบ Agentic Company

เอกสารนี้อธิบายแผนการทดสอบที่ครอบคลุมสำหรับระบบ Agentic Company เพื่อให้มั่นใจว่าทุกส่วนประกอบทำงานได้อย่างถูกต้อง มีประสิทธิภาพ และเป็นไปตามข้อกำหนดที่วางไว้ การทดสอบจะแบ่งออกเป็นหลายระดับ ตั้งแต่ Unit Test ไปจนถึง End-to-End Test และการทดสอบเฉพาะสำหรับฟังก์ชันการทำงานหลักของระบบ

## 1. หลักการทดสอบ

*   **ครอบคลุม:** ทดสอบทุกส่วนของระบบตั้งแต่ระดับเล็กที่สุดไปจนถึงภาพรวมทั้งหมด
*   **อัตโนมัติ:** เน้นการสร้าง Automated Tests เพื่อให้สามารถรันการทดสอบได้บ่อยครั้งและรวดเร็ว
*   **ต่อเนื่อง:** ผนวกการทดสอบเข้ากับกระบวนการ CI/CD เพื่อให้มั่นใจว่าโค้ดใหม่ไม่สร้างปัญหา
*   **ประสิทธิภาพ:** ทดสอบประสิทธิภาพของระบบภายใต้โหลดการทำงานที่แตกต่างกัน
*   **ความปลอดภัย:** ตรวจสอบช่องโหว่และความปลอดภัยของระบบ

## 2. ประเภทของการทดสอบ

### 2.1 Unit Test

*   **วัตถุประสงค์:** ทดสอบการทำงานของแต่ละฟังก์ชัน, เมธอด, หรือคลาสแยกกันอย่างอิสระ
*   **ขอบเขต:** โค้ดแต่ละส่วนของ Services ต่างๆ เช่น `persistent-agent-layer`, `spawn-manager`, `memory-system`, `translation-layer`, `ceo-agent`, `discord-bot`, `telegram-bot`, `account-manager`
*   **ตัวอย่าง:**
    *   ทดสอบว่าฟังก์ชัน `translate()` ใน `translation-layer` แปลข้อความได้ถูกต้อง
    *   ทดสอบว่า `AgentProcessManager` สามารถ Start/Stop Agent Process ได้
    *   ทดสอบว่า `AccountRotation` เลือกบัญชี LLM ได้ตามกลยุทธ์ที่กำหนด

### 2.2 Integration Test

*   **วัตถุประสงค์:** ทดสอบการทำงานร่วมกันของส่วนประกอบต่างๆ ของระบบ
*   **ขอบเขต:** การเชื่อมต่อระหว่าง Services, การสื่อสารระหว่าง Agent, การทำงานร่วมกันของ Memory System กับ Agent
*   **ตัวอย่าง:**
    *   ทดสอบการเชื่อมต่อระหว่าง `ceo-agent` กับ `spawn-manager` ในการสั่ง Spawn Agent
    *   ทดสอบการบันทึกและดึงข้อมูลจาก `memory-system` โดย Agent
    *   ทดสอบการสื่อสารระหว่าง `discord-bot` กับ `openclaw-gateway`

### 2.3 End-to-End (E2E) Test

*   **วัตถุประสงค์:** ทดสอบ Flow การทำงานทั้งหมดของระบบจากมุมมองของผู้ใช้งาน (บอส) หรือ Agent
*   **ขอบเขต:** Flow การทำงานหลักของบริษัท (Boss -> CEO -> Agents -> Task Completion -> Report Back)
*   **ตัวอย่าง:**
    *   บอสส่งคำสั่งผ่าน Telegram -> CEO รับคำสั่ง -> CEO วางแผน -> CEO มอบหมายงาน -> Agent ทำงาน -> Agent รายงานผล -> CEO สรุปและรายงานบอส
    *   Flow การแจ้งเตือนเงินเข้าออก 24/7 ของ Accountant Agent

### 2.4 LLM Account Rotation Test

*   **วัตถุประสงค์:** ตรวจสอบกลไกการสลับบัญชี LLM และ Load Balancing ของ Antigravity Proxy
*   **ขอบเขต:** `account-manager` service และการเชื่อมต่อกับ LLM Provider
*   **รายละเอียด:**
    *   **การสลับบัญชี:** ทดสอบว่าระบบสามารถสลับใช้บัญชี Google Account ได้อย่างถูกต้องตามกลยุทธ์ (เช่น Round-robin)
    *   **การจัดการ Rate Limit:** จำลองสถานการณ์ที่บัญชีหนึ่งถูก Rate Limit และตรวจสอบว่าระบบสามารถสลับไปใช้บัญชีอื่นได้โดยอัตโนมัติ
    *   **การจัดการ Error:** ทดสอบการจัดการ Error เมื่อบัญชี LLM ไม่สามารถใช้งานได้ชั่วคราว
    *   **ประสิทธิภาพ:** วัด Latency และ Throughput ของการเรียกใช้ LLM ภายใต้การสลับบัญชี

### 2.5 Gmail Account Switching Test

*   **วัตถุประสงค์:** ทดสอบการทำงานจริงของการสลับบัญชี Google Account ที่เชื่อมต่อไว้กับ Gmail
*   **ขอบเขต:** Antigravity Proxy, `account-manager` service, และ Gmail API/OAuth
*   **รายละเอียด:**
    *   **Login Test:** ตรวจสอบว่า Antigravity Proxy สามารถ Login เข้าสู่ Google Account ที่เชื่อมต่อไว้ได้สำเร็จ
    *   **Switching Test:** ทดสอบการสลับใช้บัญชี Google Account ในการส่ง Request ไปยัง LLM Provider (หรือบริการ Google อื่นๆ ที่ใช้ OAuth) ได้อย่างถูกต้อง
    *   **Rate Limit Simulation:** จำลองการใช้งานที่ทำให้เกิด Rate Limit และตรวจสอบการสลับบัญชี
    *   **Error Handling:** ทดสอบสถานการณ์ที่บัญชีถูกระงับหรือมีปัญหาในการเข้าถึง

### 2.6 Persistent Agent Lifecycle Test

*   **วัตถุประสงค์:** ตรวจสอบการทำงานของ Persistent Agent ตั้งแต่เริ่มต้นจนถึงการรันต่อเนื่อง
*   **ขอบเขต:** `persistent-agent-layer` service
*   **รายละเอียด:**
    *   **Start/Stop:** ทดสอบการ Start และ Stop Agent Process
    *   **Heartbeat:** ตรวจสอบว่า Heartbeat Mechanism ทำงานถูกต้องและ Agent ยังคง Active
    *   **Auto-restart:** ทดสอบว่า Agent ที่ล้มเหลวสามารถ Restart ตัวเองได้โดยอัตโนมัติ
    *   **State Persistence:** ตรวจสอบว่าสถานะและ Memory ของ Persistent Agent ยังคงอยู่หลังจากการ Restart

### 2.7 Spawn Manager Test

*   **วัตถุประสงค์:** ตรวจสอบการทำงานของ Spawn Manager ในการจัดการ Spawn-on-Demand Agents
*   **ขอบเขต:** `spawn-manager` service
*   **รายละเอียด:**
    *   **Spawn/Terminate:** ทดสอบการ Spawn และ Terminate Agent ตาม Task
    *   **Task Queue:** ตรวจสอบการจัดการ Task ใน Queue และการมอบหมายให้กับ Spawned Agent
    *   **Concurrency:** ทดสอบการจัดการจำนวน Agent ที่ Spawn พร้อมกันตาม `SPAWN_MAX_CONCURRENT`
    *   **Timeout:** ทดสอบว่า Agent ที่ทำงานเกินเวลา `SPAWN_TASK_TIMEOUT` ถูก Terminate อย่างถูกต้อง

### 2.8 Memory System Test

*   **วัตถุประสงค์:** ตรวจสอบการทำงานของ Short-term, Long-term, และ Shared Memory
*   **ขอบเขต:** `memory-system` service (Redis, Vector DB, PostgreSQL)
*   **รายละเอียด:**
    *   **Short-term Memory (Redis):** ทดสอบการบันทึกและดึงข้อมูลชั่วคราวของ Agent
    *   **Long-term Memory (Vector DB):** ทดสอบการบันทึกและค้นหาข้อมูลระยะยาว (เช่น Knowledge Base, ประสบการณ์) โดยใช้ Vector Embeddings
    *   **Shared Memory (Redis/PostgreSQL):** ทดสอบการสื่อสารและแบ่งปันข้อมูลระหว่าง Agent
    *   **Data Integrity:** ตรวจสอบความถูกต้องของข้อมูลที่บันทึกและดึงออกมา

### 2.9 Translation Layer Test

*   **วัตถุประสงค์:** ตรวจสอบความถูกต้องและประสิทธิภาพของระบบแปลภาษา
*   **ขอบเขต:** `translation-layer` service
*   **รายละเอียด:**
    *   **ความถูกต้องของการแปล:** ทดสอบการแปลจากไทยเป็นอังกฤษและอังกฤษเป็นไทยสำหรับข้อความต่างๆ
    *   **Latency:** วัดเวลาที่ใช้ในการแปลข้อความ
    *   **Error Handling:** ทดสอบการจัดการ Error เมื่อบริการแปลภาษาไม่พร้อมใช้งาน
    *   **Mode Switching:** ทดสอบการสลับ `TRANSLATION_MODE` ระหว่าง LLM และ Translation API

## 3. เครื่องมือทดสอบที่แนะนำ

*   **Unit/Integration Tests:** Jest, Mocha, Vitest
*   **E2E Tests:** Playwright, Cypress
*   **Performance Testing:** K6, JMeter
*   **Security Testing:** OWASP ZAP, Nessus
*   **Mocking/Stubbing:** Sinon.js, Nock

## 4. กระบวนการทดสอบ

1.  **เขียน Test Cases:** กำหนด Test Cases ที่ชัดเจนสำหรับแต่ละประเภทการทดสอบ
2.  **พัฒนา Automated Tests:** เขียนโค้ดสำหรับ Automated Tests
3.  **รัน Tests:** รันการทดสอบเป็นประจำ (เช่น ทุกครั้งที่มีการ Push โค้ดใหม่)
4.  **วิเคราะห์ผล:** ตรวจสอบผลการทดสอบและแก้ไข Bug ที่พบ
5.  **รายงาน:** จัดทำรายงานผลการทดสอบเพื่อติดตามคุณภาพของระบบ

แผนการทดสอบนี้จะถูกปรับปรุงและขยายตามความคืบหน้าของการพัฒนาและข้อกำหนดที่เปลี่ยนแปลงไป
