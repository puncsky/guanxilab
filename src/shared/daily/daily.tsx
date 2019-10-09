import gql from "graphql-tag";
import React, { Component } from "react";
import { Query, QueryResult } from "react-apollo";
import { Preloader } from "../common/preloader";
import { ContentPadding } from "../common/styles/style-padding";

const query = gql`
  query gxArticles($skip: Int, $limit: Int) {
    gxArticles(skip: $skip, limit: $limit) {
      url
      title
      content
      forwardedFor
      date
      visitorCount
      tags {
        enum
      }
    }
  }
`;

type GxArticle = {
  title: string;
  date: string;
  tags: Array<string>;
  forwardedFor: string;
  content: string;
  short: string;
};

export class Daily extends Component {
  public render(): JSX.Element {
    return (
      <ContentPadding>
        <Query
          query={query}
          variables={{
            skip: 0,
            limit: 1000
          }}
        >
          {({
            data,
            error,
            loading
          }: QueryResult<{ gxArticles: GxArticle }>) => {
            if (loading || error || !data) {
              return <Preloader />;
            }

            return <>{JSON.stringify(data.gxArticles, null, 2)}</>;
          }}
        </Query>
      </ContentPadding>
    );
  }
}
