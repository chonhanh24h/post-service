import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { config } from 'dotenv';

// Tải biến môi trường từ file .env trước khi khởi tạo app
config();

async function bootstrap() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3003;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0', // Để có thể kết nối từ bên ngoài container (nếu dùng Docker)
        port: port,
      },
    },
  );

  await app.listen();
  console.log(`Post Microservice is running on port: ${port}`);
}
bootstrap();
