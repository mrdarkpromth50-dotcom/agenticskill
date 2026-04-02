# โครงสร้างบริษัทและบทบาทของ Agent (Agent Roles)

เอกสารนี้อธิบายโครงสร้างของบริษัท Agentic ที่แบ่งออกเป็น 2 ประเภทหลักคือ Persistent Swarm Workers (รันถาวร 24/7) และ Spawn-on-Demand Workers (สร้างตาม Task) พร้อมรายละเอียดหน้าที่และ Skill/Tool ของแต่ละตำแหน่ง

## 1. การแบ่งประเภท Agent

ระบบ Hybrid Agent แบ่ง Agent ออกเป็น 2 ประเภทหลัก เพื่อความสมดุลระหว่างประสิทธิภาพการทำงานและการใช้ทรัพยากร:

### 1.1 Persistent Swarm Workers (รันถาวร 24/7)

Agent กลุ่มนี้เปรียบเสมือนผู้บริหารและพนักงานหลักของบริษัทที่ต้องเตรียมพร้อมรับมือกับสถานการณ์ต่างๆ ตลอดเวลา มี Memory ของตัวเอง (Long-term & Short-term) เพื่อจดจำบริบทของบริษัทและโปรเจกต์ต่างๆ ได้อย่างต่อเนื่อง

*   **เหตุผลที่ต้องรันถาวร:**
    *   ต้องรับคำสั่งและสื่อสารกับบอส (มนุษย์) ตลอดเวลา
    *   ต้องเฝ้าระวังระบบ, แจ้งเตือน, และตัดสินใจในระดับภาพรวม
    *   ต้องรักษา Context และความรู้ของบริษัทไว้ไม่ให้สูญหายเมื่อจบ Task
    *   ต้องบริหารจัดการและสั่งการ Spawn-on-Demand Agent

### 1.2 Spawn-on-Demand Workers (สร้างตาม Task)

Agent กลุ่มนี้เปรียบเสมือนพนักงานชั่วคราวหรือผู้เชี่ยวชาญเฉพาะทางที่จะถูกสร้าง (Spawn) ขึ้นมาเมื่อมี Task ที่ต้องทำ และจะถูกทำลาย (Terminate) เมื่อ Task นั้นเสร็จสิ้น เพื่อคืนทรัพยากรให้กับระบบ

*   **เหตุผลที่ไม่ต้องรันถาวร:**
    *   ประหยัดทรัพยากรคอมพิวเตอร์ (CPU, RAM) และค่าใช้จ่าย API (LLM Tokens)
    *   ทำงานเฉพาะเจาะจงตาม Task ที่ได้รับมอบหมาย ไม่จำเป็นต้องรู้บริบททั้งหมดของบริษัท
    *   สามารถ Scale จำนวน Agent ได้ตามปริมาณงาน (เช่น Spawn Frontend Dev 3 ตัวพร้อมกัน)

## 2. โครงสร้างบริษัทและหน้าที่ของ Agent

| ตำแหน่ง | ประเภท | หน้าที่รับผิดชอบหลัก | Skill / Tool ที่ใช้ |
| :--- | :--- | :--- | :--- |
| **CEO** (Chief Executive Officer) | Persistent | รับคำสั่งจากบอส, วางแผนภาพรวม, มอบหมายงานให้ Agent อื่น, สรุปผลงานรายงานบอส, เสนอเทรนด์/โอกาสใหม่ๆ | Telegram Bot API, TUI CLI, Task Delegation, Proactive Research, Memory Access |
| **CTO** (Chief Technology Officer) | Persistent | ดูแลสถาปัตยกรรมระบบ, ตัดสินใจเลือกเทคโนโลยี, ตรวจสอบ Code Quality, สั่ง Spawn Dev/QA/Debugger | Architecture Design, Code Review, Spawn Manager API, System Monitoring |
| **CMO** (Chief Marketing Officer) | Persistent | วางแผนการตลาด, วิเคราะห์กลุ่มเป้าหมาย, สั่ง Spawn Copywriter/Designer, อนุมัติ Content | Market Analysis, Campaign Planning, Content Approval |
| **CSO** (Chief Strategy Officer) | Persistent | วางกลยุทธ์ระยะยาว, วิเคราะห์คู่แข่ง, ค้นหาโอกาสทางธุรกิจใหม่ๆ, ทำงานร่วมกับ CEO | Strategic Planning, Competitor Analysis, Trend Forecasting |
| **Accountant** (พนักงานบัญชี) | Persistent | เฝ้าระวังเงินเข้า-ออก 24/7, บันทึกบัญชี, แจ้งเตือนผ่าน Discord, สรุปงบการเงิน | Bank API Integration, Discord Webhook, Financial Reporting, Alert System |
| **DevOps Engineer** | Persistent | ดูแล CI/CD Pipeline, จัดการ Server/Cloud, เฝ้าระวังระบบ (Monitoring), สั่ง Spawn RedTeam | CI/CD Tools (GitHub Actions), Docker/Kubernetes, Monitoring Tools (Prometheus/Grafana) |
| **Dev Lead** | Spawn-on-Demand | นำทีม Dev, แบ่ง Task ย่อยให้ Frontend/Backend, รวบรวม Code | Agile/Scrum Management, Code Integration |
| **Frontend Developer** | Spawn-on-Demand | เขียน Code ส่วนหน้าบ้าน (UI/UX), เชื่อมต่อ API | React/Vue/Angular, HTML/CSS, API Integration |
| **Backend Developer** | Spawn-on-Demand | เขียน Code ส่วนหลังบ้าน, จัดการ Database, สร้าง API | Node.js/Python/Go, SQL/NoSQL, API Development |
| **Debugger** | Spawn-on-Demand | ค้นหาและแก้ไข Bug ใน Code ตามที่ CTO หรือ Dev Lead สั่ง | Debugging Tools, Log Analysis, Code Patching |
| **Software Tester / QA** | Spawn-on-Demand | ทดสอบระบบ (Unit Test, Integration Test, E2E Test), รายงาน Bug | Testing Frameworks (Jest, Selenium, Cypress), Bug Reporting |
| **Designer** | Spawn-on-Demand | ออกแบบ UI/UX, สร้าง Graphic Asset ตามที่ CMO สั่ง | Figma/Adobe XD, Image Generation (Midjourney/DALL-E) |
| **Copywriter** | Spawn-on-Demand | เขียน Content, บทความ, โฆษณา ตามที่ CMO สั่ง | Creative Writing, SEO Optimization |
| **Researcher** | Spawn-on-Demand | ค้นหาข้อมูลเชิงลึก, รวบรวมข้อมูลตามที่ CSO หรือ CEO สั่ง | Web Scraping, Data Gathering, Academic Search |
| **Analyst** | Spawn-on-Demand | วิเคราะห์ข้อมูล (Data), สร้าง Dashboard, สรุป Insight | Data Analysis (Python/Pandas), Data Visualization |
| **Hacker / RedTeam** | Spawn-on-Demand | ทดสอบเจาะระบบ (Penetration Testing), หาช่องโหว่ความปลอดภัย | Security Auditing Tools, Vulnerability Scanning |
| **Strategist** | Spawn-on-Demand | วางแผนแคมเปญเฉพาะกิจ, วิเคราะห์ข้อมูลตลาดเชิงลึก | Campaign Strategy, Market Research |

## 3. Flow การทำงานของ Accountant (Persistent)

Accountant Agent จะทำงานตลอด 24/7 เพื่อเฝ้าระวังการทำธุรกรรมทางการเงินและแจ้งเตือนทันที

```mermaid
graph TD
    A[Accountant Agent (Persistent)] -- เฝ้าระวัง 24/7 --> B(Bank API / Payment Gateway)
    B -- มีเงินเข้า/ออก --> C(ดึงข้อมูลธุรกรรม)
    C -- ตรวจสอบ & จัดรูปแบบ --> D(สร้างข้อความแจ้งเตือน)
    D -- ส่งผ่าน Discord Webhook --> E[Discord: ห้อง Finance/Accounting]
    E -- บอส/CEO รับทราบ --> F(บันทึกลง Long-term Memory)
```

## 4. Flow การทำงานของ CTO (Persistent)

CTO Agent จะดูแลระบบและสั่ง Spawn Debugger เมื่อพบปัญหา

```mermaid
graph TD
    A[CTO Agent (Persistent)] -- เฝ้าระวังระบบ --> B(System Logs / Error Reports)
    B -- พบ Error/Bug --> C(วิเคราะห์ความรุนแรง)
    C -- สั่ง Spawn --> D(Spawn Manager)
    D -- สร้าง --> E[Debugger Agent (Spawned)]
    E -- แก้ไข Bug --> F(ส่ง Code Patch)
    F -- CTO ตรวจสอบ --> G{ผ่าน?}
    G -- Yes --> H(Merge Code & Terminate Debugger)
    G -- No --> E
```
