# Discord Bot Service

บริการนี้ทำหน้าที่เป็น Discord Bot สำหรับเชื่อมต่อระบบ Agentic Company เข้ากับ Discord Server เพื่อให้ Agent สามารถสื่อสารกัน, รับคำสั่งจาก CEO (ผ่าน OpenClaw Gateway), และรายงานผลการทำงานในช่องทาง Discord ที่เหมาะสม

## คุณสมบัติหลัก

*   **การเชื่อมต่อ Discord:** เชื่อมต่อกับ Discord API เพื่อรับส่งข้อความและจัดการช่องทาง
*   **การจัดการช่องทาง:** สามารถสร้าง, จัดการ, และกำหนดสิทธิ์ของช่องทาง Discord สำหรับแต่ละแผนกหรือ Agent
*   **การสื่อสารภายใน:** เป็นส่วนหนึ่งของกลไกการสื่อสารระหว่าง Agent และ CEO
*   **การรับคำสั่ง:** สามารถรับคำสั่งพื้นฐานผ่าน Discord (เช่น `!status`, `!create_channel`)

## การติดตั้งและรัน

1.  สร้าง Discord Bot Token และ Guild ID จาก Discord Developer Portal
2.  ตั้งค่า `DISCORD_BOT_TOKEN` และ `DISCORD_GUILD_ID` ในไฟล์ `.env.example`
3.  รันบริการนี้โดยใช้ Docker Compose (ดู `docker-compose.yml`)

## โครงสร้างไฟล์

*   `index.ts`: จุดเริ่มต้นของบริการ
*   `bot.ts`: คลาสหลักของ Discord Bot สำหรับจัดการ Event และการรับส่งข้อความ
*   `channel-manager.ts`: คลาสสำหรับจัดการช่องทาง Discord (สร้าง, ดึงข้อมูล)
*   `types.ts`: Type Definitions สำหรับ Discord Message และ Channel Configuration
