import serialize from "form-serialize";
import { t } from "onefx/lib/iso-i18n";
// @ts-ignore
import { Helmet } from "onefx/lib/react-helmet";
// @ts-ignore
import { styled } from "onefx/lib/styletron-react";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import Button from "antd/lib/button";
import { colorHover } from "../../../common/color-hover";
import { Flex } from "../../../common/flex";
import { transition } from "../../../common/styles/style-animation";
import { colors } from "../../../common/styles/style-color";
import { fullOnPalm } from "../../../common/styles/style-media";
import { ContentPadding } from "../../../common/styles/style-padding";
import { axiosInstance } from "./axios-instance";
import { ContinueWithBlockstack } from "./continue-with-blockstack";
import { EmailField } from "./email-field";
import { FieldMargin } from "./field-margin";
import { FormContainer } from "./form-container";
import { PasswordField } from "./password-field";
import { postSignUpLocal } from "./post-auth-local";

const LOGIN_FORM = "signup";

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

export class SignUpInner extends Component<Props, State> {
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
    const r = await axiosInstance.post("/api/sign-up/", {
      email,
      password,
      next
    });
    if (r.data.ok && r.data.shouldRedirect && !r.data.authToken) {
      await postSignUpLocal(password);
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
        errorEmail: "",
        errorPassword: "",
        disableButton: false
      };
      switch (error.code) {
        case "auth/email-already-in-use":
        case "auth/invalid-email": {
          errorState.errorEmail = error.message;
          break;
        }
        default:
        case "auth/weak-password": {
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
            <Helmet title={`Sign Up - ${t("topbar.brand")}`} />
            <Flex column={true}>
              <h1>Create Account</h1>
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
              <div
                style={{ fontSize: "10px" }}
                dangerouslySetInnerHTML={{
                  __html: t("auth/consent", {
                    tosUrl: "/page/legal/terms-of-service",
                    policyUrl: "/page/legal/privacy-policy"
                  })
                }}
              />
            </FieldMargin>

            <FieldMargin>
              <StyleLink to="/login/">
                {t("auth/sign_up.switch_to_sign_in")}
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

export const StyleLink = styled(Link, {
  ...colorHover(colors.primary),
  textDecoration: "none",
  transition
});

const Form = styled(FormContainer, {
  width: "320px",
  ...fullOnPalm
});

export const SignUp = connect(
  // tslint:disable-next-line:no-any
  (state: any) => ({ next: state.base.next })
)(SignUpInner);
