import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing
  app.use(cookieParser());

  // Auth routes use explicit ZodValidationPipe on parameters; no global validation pipe

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API server running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error("Failed to start API server:", err);
  process.exit(1);
});
