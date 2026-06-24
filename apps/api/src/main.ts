import { NestFactory } from "@nestjs/core";
import { VersioningType } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable cookie parsing
	app.use(cookieParser());

	// Enable CORS to allow the Vite web app to send cookie credentials
	app.enableCors({
		origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
		credentials: true,
	});

	// Global prefix and URI versioning: produces /api/v1/... paths
	app.enableVersioning({ type: VersioningType.URI });

	// Auth routes use explicit ZodValidationPipe on parameters; no global validation pipe

	const port = process.env.PORT ?? 3000;
	await app.listen(port);
	console.log(`API server running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
	console.error("Failed to start API server:", err);
	process.exit(1);
});
