# Telegram Bot Service

บริการนี้ทำหน้าที่เป็น Telegram Bot สำหรับรับคำสั่งจาก Boss และส่งต่อไปยัง CEO Agent. เป็นช่องทางหลักที่ Boss ใช้ในการสื่อสารกับระบบ Agentic Company

## คุณสมบัติหลัก

*   **รับคำสั่งจาก Boss:** รับข้อความจาก Boss ผ่าน Telegram และส่งต่อไปยัง CEO Agent
*   **การสื่อสารแบบ 2 ทาง:** CEO Agent สามารถส่งข้อความกลับไปยัง Boss ผ่าน Bot นี้ได้
*   **การยืนยันตัวตน:** ตรวจสอบ `TELEGRAM_CHAT_ID` เพื่อให้แน่ใจว่ารับคำสั่งจาก Boss ที่ถูกต้องเท่านั้น

## การติดตั้งและรัน

1.  สร้าง Telegram Bot Token จาก BotFather ใน Telegram
2.  รับ `chat_id` ของ Boss (สามารถทำได้โดยส่งข้อความหา Bot แล้วเรียก API `getUpdates` หรือใช้ Bot อื่นช่วย)
3.  ตั้งค่า `TELEGRAM_BOT_TOKEN` และ `TELEGRAM_CHAT_ID` ในไฟล์ `.env.example`
4.  รันบริการนี้โดยใช้ Docker Compose (ดู `docker-compose.yml`)

## โครงสร้างไฟล์

*   `index.ts`: จุดเริ่มต้นของบริการ
*   `bot.ts`: คลาสหลักของ Telegram Bot สำหรับจัดการ Event และการรับส่งข้อความ
*   `command-handler.ts`: คลาสสำหรับประมวลผลคำสั่งที่ได้รับจาก Boss (ส่งต่อไปยัง CEO Agent)
*   `types.ts`: Type Definitions สำหรับ Telegram Message
