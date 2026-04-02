# LLM Account Manager Service

บริการนี้มีหน้าที่จัดการบัญชี LLM (Large Language Model) หลายบัญชี รวมถึงการทำ Account Rotation และ Health Check เพื่อให้มั่นใจว่าระบบ Agentic Company มี LLM API ที่พร้อมใช้งานอยู่เสมอ และสามารถรับมือกับ Rate Limiting หรือปัญหาบัญชีอื่นๆ ได้อย่างมีประสิทธิภาพ

## คุณสมบัติหลัก

*   **Account Rotation:** หมุนเวียนการใช้งานบัญชี LLM เพื่อกระจายโหลดและหลีกเลี่ยง Rate Limiting
*   **Health Check:** ตรวจสอบสถานะความพร้อมใช้งานของแต่ละบัญชี LLM อย่างสม่ำเสมอ
*   **Load Balancing:** (ในอนาคต) กระจายคำขอไปยังบัญชีที่เหมาะสมที่สุดตามสถานะและโหลด
*   **Gmail Account Switching Test:** รองรับการทดสอบการสลับบัญชี Gmail สำหรับการเข้าถึง LLM

## การติดตั้งและรัน

1.  ตั้งค่า `LLM_ACCOUNTS` (ในรูปแบบ JSON array ของ LLMAccount objects) ในไฟล์ `.env.example`
2.  ตั้งค่า `ACCOUNT_ROTATION_INTERVAL` และ `LLM_ACCOUNT_HEALTH_CHECK_INTERVAL` ในไฟล์ `.env.example`
3.  รันบริการนี้โดยใช้ Docker Compose (ดู `docker-compose.yml`)

## โครงสร้างไฟล์

*   `index.ts`: จุดเริ่มต้นของบริการ
*   `rotation.ts`: คลาสสำหรับจัดการ Account Rotation และการเลือกบัญชี
*   `health-check.ts`: กลไก Health Check สำหรับตรวจสอบสถานะบัญชี LLM
*   `types.ts`: Type Definitions สำหรับ LLM Account และ Status
