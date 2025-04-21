import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
  UsePipes,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { z } from "zod";

import { PrismaService } from "../prisma/prisma.service";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";
import { compare } from "bcryptjs";

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type AuthenticateBody = z.infer<typeof authenticateBodySchema>;

@Controller("/sessions")
export class AuthenticateController {
  constructor(
    private readonly jwt: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() authenticateBody: AuthenticateBody) {
    const { email, password } = authenticateBody;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("User credentials do not match.");
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("User credentials do not match.");
    }

    const accessToken = this.jwt.sign({ sub: user.id });

    return { access_token: accessToken };
  }
}
