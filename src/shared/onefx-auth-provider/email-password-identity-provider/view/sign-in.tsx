import Button from "antd/lib/button";
import serialize from "form-serialize";
import { t } from "onefx/lib/iso-i18n";
// @ts-ignore
import { Helmet } from "onefx/lib/react-helmet";
import { styled } from "onefx/lib/styletron-react";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Flex } from "../../../common/flex";
import { fullOnPalm } from "../../../common/styles/style-media";
import { ContentPadding } from "../../../common/styles/style-padding";
import { axiosInstance } from "./axios-instance";
import { ContinueWithBlockstack } from "./continue-with-blockstack";
import { EmailField } from "./email-field";
import { FieldMargin } from "./field-margin";
import { FormContainer } from "./form-container";
import { PasswordField } from "./password-field";
import { postSignInLocal } from "./post-auth-local";
import { StyleLink } from "./sign-up";

const LOGIN_FORM = "login";

type State = {
  errorEmail: string;
  errorPassword: string;

  valueEmail: string;
  valuePassword: string;

  disableButton: boolean;
};

type Props = {
  next: string;
};

class SignInInner extends Component<Props, State> {
  public state: State = {
    errorEmail: "",
    errorPassword: "",

    valueEmail: "",
    valuePassword: "",

    disableButton: false
  };

  public async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const el = window.document.getElementById(LOGIN_FORM) as HTMLFormElement;
    if (!el) {
      return;
    }
    const { email = "", password = "", next = "" } = serialize(el, {
      hash: true
    }) as {
      email: string;
      password: string;
      next: string;
    };
    this.setState({
      disableButton: true,
      valueEmail: email,
      valuePassword: password
    });
    const r = await axiosInstance.post("/api/sign-in/", {
      email,
      password,
      next
    });
    if (r.data.ok && r.data.shouldRedirect && !r.data.authToken) {
      await postSignInLocal(password);
      window.location.href = r.data.next;
    }
    if (r.data.ok && r.data.authToken) {
      // web view login in
      // @ts-ignore
      window.postMessage(JSON.stringify({ authToken: r.data.authToken }));
    } else if (r.data.error) {
      const { error } = r.data;
      const errorState = {
        valueEmail: email,
        valuePassword: this.state.valuePassword,
        errorEmail: "",
        errorPassword: "",
        disableButton: false
      };
      switch (error.code) {
        case "auth/invalid-email":
        case "auth/user-disabled":
        case "auth/user-not-found": {
          errorState.errorEmail = error.message;
          break;
        }
        default:
        case "auth/wrong-password": {
          errorState.errorPassword = error.message;
        }
      }
      this.setState(errorState);
    }
  }

  public render(): JSX.Element {
    const { errorEmail, errorPassword, valueEmail, valuePassword } = this.state;
    return (
      <ContentPadding>
        <Flex minHeight="550px" center={true}>
          <Form id={LOGIN_FORM} onSubmit={this.onSubmit}>
            <Helmet title={`login - ${t("topbar.brand")}`} />
            <Flex column={true}>
              <h1>{t("auth/sign_in.title")}</h1>
              <EmailField error={errorEmail} defaultValue={valueEmail} />
              {/* tslint:disable-next-line:react-a11y-input-elements */}
              <input hidden={true} name="next" defaultValue={this.props.next} />
              <PasswordField
                error={errorPassword}
                defaultValue={valuePassword}
              />
              <FieldMargin>
                {/*
                // @ts-ignore */}
                <Button
                  type="primary"
                  htmlType="submit"
                  // @ts-ignore
                  onClick={(e: Event) => this.onSubmit(e)}
                  style={{ width: "100%" }}
                  size="large"
                  loading={this.state.disableButton}
                >
                  {t("auth/button_submit")}
                </Button>
              </FieldMargin>
            </Flex>
            <FieldMargin>
              <StyleLink to="/sign-up">
                {t("auth/sign_in.switch_to_sign_up")}
              </StyleLink>
            </FieldMargin>

            <FieldMargin>
              <ContinueWithBlockstack />
            </FieldMargin>
          </Form>
        </Flex>
      </ContentPadding>
    );
  }
}

const Form = styled(FormContainer, {
  width: "320px",
  ...fullOnPalm
});

export const SignIn = connect(
  // tslint:disable-next-line:no-any
  (state: any) => ({ next: state.base.next })
)(SignInInner);
