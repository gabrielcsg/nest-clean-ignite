import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";

import { PrismaService } from "../prisma/prisma.service";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { UserPayload } from "../auth/jwt.strategy";

const createQuestionBodySchema = z.object({
  title: z.string(),
  content: z.string(),
});

type CreateQuestionBody = z.infer<typeof createQuestionBodySchema>;

const bodyValidationPipe = new ZodValidationPipe(createQuestionBodySchema);

@Controller("/questions")
@UseGuards(JwtAuthGuard)
export class CreateQuestionController {
  constructor(private readonly prismaService: PrismaService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe)
    createQuestionBody: CreateQuestionBody,
  ) {
    const { title, content } = createQuestionBody;
    const userId = user.sub;
    const slug = this.convertToSlug(title);

    await this.prismaService.question.create({
      data: {
        title,
        slug,
        content,
        authorId: userId,
      },
    });
  }

  private convertToSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }
}
