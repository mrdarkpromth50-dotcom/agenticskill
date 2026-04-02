# Spawn Manager Service

บริการนี้มีหน้าที่จัดการการ Spawn และ Terminate Agents แบบ Spawn-on-Demand. Agent ประเภทนี้จะถูกสร้างขึ้นเมื่อมี Task เฉพาะกิจเข้ามา และจะถูก Terminate เมื่อทำงานเสร็จสิ้น เพื่อประหยัดทรัพยากรและเพิ่มความยืดหยุ่นของระบบ

## คุณสมบัติหลัก

*   **การจัดการ Agent Lifecycle:** Spawn Agent ตามความต้องการและ Terminate เมื่อทำงานเสร็จ
*   **Task Queue Management:** จัดการคิวของ Task ที่รอการประมวลผลโดย Spawned Agents
*   **Concurrency Control:** ควบคุมจำนวน Spawned Agents ที่ทำงานพร้อมกันเพื่อป้องกันการใช้ทรัพยากรเกินจำเป็น
*   **Task Timeout:** ตรวจสอบและ Terminate Agent ที่ทำงานเกินเวลาที่กำหนด

## การติดตั้งและรัน

1.  ตรวจสอบให้แน่ใจว่าได้ตั้งค่า `SPAWN_MAX_CONCURRENT` และ `SPAWN_TASK_TIMEOUT` ในไฟล์ `.env.example` แล้ว
2.  รันบริการนี้โดยใช้ Docker Compose (ดู `docker-compose.yml`)

## โครงสร้างไฟล์

*   `index.ts`: จุดเริ่มต้นของบริการ
*   `process-manager.ts`: คลาสสำหรับจัดการการ Spawn และ Terminate Agent Processes
*   `task-queue.ts`: คลาสสำหรับจัดการคิวของ Task
*   `types.ts`: Type Definitions สำหรับ Agent Configuration และ Task
