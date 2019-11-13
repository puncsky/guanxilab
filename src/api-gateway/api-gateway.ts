import { HttpLink } from "apollo-link-http";
import {
  ApolloServer,
  introspectSchema,
  makeRemoteExecutableSchema,
  mergeSchemas
} from "apollo-server-koa";
import koa from "koa";
import { logger } from "onefx/lib/integrated-gateways/logger";
import path from "path";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { Model } from "../model";
import { Gateways } from "../server/gateway/gateway";
import { MyServer } from "../server/start-server";
import { ArticleResolver } from "../shared/article/article-resolver";
import { OnefxAuth } from "../shared/onefx-auth";
import { AccountResolve } from "./resolvers/account-resolver";
import { ContactResolver } from "./resolvers/contact-resolver";
import { MetaResolver } from "./resolvers/meta-resolver";

export type Context = {
  model: Model;
  gateways: Gateways;
  userId: string;
  auth: OnefxAuth;
  ctx: koa.Context;
};

export async function setApiGateway(server: MyServer): Promise<void> {
  const resolvers = [
    MetaResolver,
    ArticleResolver,
    ContactResolver,
    AccountResolve
  ];
  server.resolvers = resolvers;

  const sdlPath = path.resolve(__dirname, "api-gateway.graphql");
  const localSchema = await buildSchema({
    resolvers,
    emitSchemaFile: {
      path: sdlPath,
      commentDescriptions: true
    },
    validate: false
  });
  const schemas = [localSchema];

  if (process.env.ENABLE_GUANXI_DAILY) {
    try {
      const remoteLink = new HttpLink({
        uri: `https://tianpan.co/api-gateway/`,
        fetch
      });
      const remoteSchema = makeRemoteExecutableSchema({
        schema: await introspectSchema(remoteLink),
        link: remoteLink
      });
      schemas.push(remoteSchema);
    } catch (err) {
      logger.error(`failed to link external tianpan.co api`);
    }
  }

  const schema = mergeSchemas({
    schemas
  });

  const apollo = new ApolloServer({
    schema,
    introspection: true,
    playground: true,
    context: async ({ ctx }): Promise<Context> => {
      const token = server.auth.tokenFromCtx(ctx);
      const userId = await server.auth.jwt.verify(token);
      return {
        userId,
        model: server.model,
        gateways: server.gateways,
        auth: server.auth,
        ctx
      };
    }
  });
  const gPath = "/api-gateway/";
  apollo.applyMiddleware({
    // @ts-ignore
    app: server.app,
    path: gPath
  });
}
