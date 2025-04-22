import { AppModule } from "@/app.module";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { PrismaService } from "@/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("Create question E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  test("[POST] /create-question", async () => {
    const user = await prisma.user.create({
      data: {
        name: "John Doe",
        email: "johndoe@email.com",
        password: "123456",
      },
    });

    const accessToken = jwt.sign({ sub: user.id });

    const response = await request(app.getHttpServer())
      .post("/questions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "New Question",
        content: "Question content",
      });

    expect(response.statusCode).toBe(201);

    const questionOnDatabase = await prisma.question.findFirst({
      where: {
        title: "New Question",
      },
    });

    expect(questionOnDatabase?.id).toBeDefined();
  });
});
