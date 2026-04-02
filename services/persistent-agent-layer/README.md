# Persistent Agent Layer Service

บริการนี้มีหน้าที่จัดการและรัน Persistent Agents ทั้งหมดในระบบ Agentic Company. Persistent Agents คือ Agent หลักที่ทำงานตลอดเวลา 24/7 และมี Memory เป็นของตัวเอง เช่น CEO, CTO, CMO, Accountant.

## คุณสมบัติหลัก

*   **การจัดการ Agent Lifecycle:** เริ่มต้น, ตรวจสอบสถานะ, และ Restart Agent ที่ล้มเหลวโดยอัตโนมัติ
*   **Heartbeat Monitoring:** ตรวจสอบว่า Persistent Agents ยังคงทำงานอยู่
*   **State Persistence:** (ในอนาคต) จัดการการบันทึกและกู้คืนสถานะของ Agent

## การติดตั้งและรัน

1.  ตรวจสอบให้แน่ใจว่าได้ตั้งค่า `PERSISTENT_AGENT_HEARTBEAT_INTERVAL` และ `PERSISTENT_AGENT_AUTO_RESTART` ในไฟล์ `.env.example` แล้ว
2.  รันบริการนี้โดยใช้ Docker Compose (ดู `docker-compose.yml`)

## โครงสร้างไฟล์

*   `index.ts`: จุดเริ่มต้นของบริการ
*   `agent-manager.ts`: คลาสสำหรับจัดการ Persistent Agents (เริ่มต้น, ตรวจสอบ, Restart)
*   `heartbeat.ts`: กลไก Heartbeat สำหรับตรวจสอบสถานะ Agent
*   `types.ts`: Type Definitions สำหรับ Agent Configuration และ Status
