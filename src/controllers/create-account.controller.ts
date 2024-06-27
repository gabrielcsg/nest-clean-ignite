import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { hash } from 'bcryptjs';

import { z } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

const createAccountBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

type CreateAccountBody = z.infer<typeof createAccountBodySchema>;

@Controller('/accounts')
export class CreateAccountController {
  constructor(private readonly prismaService: PrismaService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() createAccountBody: CreateAccountBody) {
    const { name, email, password } = createAccountBody;

    const userWithSameEmail = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (userWithSameEmail) {
      throw new ConflictException(
        'User with same e-mail address already exists'
      );
    }

    const hashedPassword = await hash(password, 8);

    await this.prismaService.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
  }
}
