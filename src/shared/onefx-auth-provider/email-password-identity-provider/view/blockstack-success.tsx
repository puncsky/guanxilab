import * as blockstack from "blockstack";
import { UserSession } from "blockstack/lib";
import React, { PureComponent } from "react";
import Helmet from "react-helmet";
import { createDidToken } from "../../../common/did-token/did-token";
import { axiosInstance } from "./axios-instance";

export class BlockstackSuccess extends PureComponent {
  async componentDidMount(): Promise<void> {
    let userData;
    try {
      userData = blockstack.loadUserData();
    } catch (e) {
      try {
        const userSession = new UserSession();
        if (userSession.isSignInPending()) {
          userData = await userSession.handlePendingSignIn();
        }
      } catch (e) {
        window.location.href = "/login/";
      }
    }
    if (!userData) {
      return;
    }

    const didToken = createDidToken(userData.appPrivateKey);
    const { data } = await axiosInstance.post("/api/did-token-exchange", {
      didToken,
      next: "/"
    });
    if (data.ok && data.shouldRedirect && !data.authToken) {
      return (window.location.href = data.next);
    }
  }

  // tslint:disable-next-line:max-func-body-length
  public render(): JSX.Element {
    return (
      <div id="loader">
        <Helmet>
          <style>{`#app {
            height: 100%;
            width: 100%
          }

            @-webkit-keyframes sk-rotatePlane {
              0% {
                transform: perspective(200px) rotateX(0) rotateY(0);
              -webkit-transform: perspective(200px) rotateX(0) rotateY(0)
            }
              25% {
              transform: perspective(200px) rotateX(-180deg) rotateY(0);
              -webkit-transform: perspective(200px) rotateX(-180deg) rotateY(0)
            }
              50% {
              transform: perspective(200px) rotateX(-180deg) rotateY(-180deg);
              -webkit-transform: perspective(200px) rotateX(-180deg) rotateY(-180deg)
            }
              75% {
              transform: perspective(200px) rotateX(-359.99deg) rotateY(-180deg);
              -webkit-transform: perspective(200px) rotateX(-359.99deg) rotateY(-180deg)
            }
              100% {
              transform: perspective(200px) rotateX(-359.99deg) rotateY(-359.99deg);
              -webkit-transform: perspective(200px) rotateX(-359.99deg) rotateY(-359.99deg)
            }
            }

            @keyframes sk-rotatePlane {
              0% {
                transform: perspective(200px) rotateX(0) rotateY(0);
              -webkit-transform: perspective(200px) rotateX(0) rotateY(0);
            }
              25% {
              transform: perspective(200px) rotateX(-180deg) rotateY(0);
              -webkit-transform: perspective(200px) rotateX(-180deg) rotateY(0);
            }
              50% {
              transform: perspective(200px) rotateX(-180deg) rotateY(-180deg);
              -webkit-transform: perspective(200px) rotateX(-180deg) rotateY(-180deg);
            }
              75% {
              transform: perspective(200px) rotateX(-359.99deg) rotateY(-180deg);
              -webkit-transform: perspective(200px) rotateX(-359.99deg) rotateY(-180deg);
            }
              100% {
              transform: perspective(200px) rotateX(-359.99deg) rotateY(-359.99deg);
              -webkit-transform: perspective(200px) rotateX(-359.99deg) rotateY(-359.99deg)
            }
            }

            #loader {
              background: #fff;
              height: calc(100vh);
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 0;
              top: 0;
              left: 0;
              position: absolute;
              pointer-events: none;
              transition: .25s all ease-in-out;
              z-index: 99999999999999;
              transform: translate3d(0, 0, 0)
            }

            #loader svg {
              -webkit-animation: sk-rotatePlane 2.4s infinite ease-in-out;
              animation: sk-rotatePlane 2.4s infinite ease-in-out;
              width: 80px !important;
              height: 80px !important;
              display: block;
              will-change: transform;
            }

            #loader.hidden {
              opacity: 0
            }

            noscript {
              display: flex;
              position: fixed;
              align-items: center;
              flex-direction: column;
              justify-content: center;
              text-align: center;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              padding: 20px;
              z-index: 99999999999999;
              background: #fff
            }

            noscript h1, noscript p {
              width: 100%;
              max-width: 620px;
              margin: 0 auto
            }

            noscript h1 {
              margin-bottom: 1.5rem;
              font-size: 2rem
            }

            noscript p {
              font-size: 1.1rem;
              line-height: 1.7rem
            }

            noscript a, noscript a:visited {
              color: #3498db;
              text-decoration: none
            `}</style>
        </Helmet>
        <svg
          width="29"
          height="28"
          viewBox="0 0 29 28"
          fill="none"
          xmlns="https://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M28.5293 19.1699C28.5293 19.1699 28.5361 22.0879 28.2129 23.3535C27.8887 24.6172 27.294 25.5 26.6358 26.1465C25.9736 26.7949 25.0977 27.3867 23.7608 27.6934C22.4248 28 19.5264 27.9961 19.5264 27.9961L8.99415 28C8.99415 28 6.02052 28.0059 4.73146 27.6895C3.44239 27.3711 2.54298 26.7871 1.88478 26.1426C1.22267 25.4922 0.621105 24.6328 0.307628 23.3203C-0.00584811 22.0098 1.12568e-05 19.166 1.12568e-05 19.166V8.83009C1.12568e-05 8.83009 -0.00682467 5.91212 0.316418 4.64649C0.640636 3.38282 1.23536 2.50001 1.89357 1.85352C2.55568 1.20509 3.43165 0.613289 4.76759 0.306648C6.1045 7.48038e-06 9.00294 0.00391372 9.00294 0.00391372L19.5352 7.47367e-06C19.5352 7.47367e-06 22.5088 -0.00585189 23.7979 0.310554C25.0869 0.628914 25.9854 1.2129 26.6445 1.85743C27.3067 2.50782 27.9082 3.3672 28.2217 4.6797C28.5352 5.99024 28.5293 8.83399 28.5293 8.83399V19.1699ZM9.65236 20.8027C10.9365 20.8027 11.9776 19.7813 11.9776 18.5215C11.9776 17.2617 10.9365 16.2402 9.65236 16.2402C8.36915 16.2402 7.32814 17.2617 7.32814 18.5215C7.32814 19.7813 8.36915 20.8027 9.65236 20.8027ZM11.9776 9.42579C11.9776 10.6856 10.9365 11.707 9.65236 11.707C8.36915 11.707 7.32814 10.6856 7.32814 9.42579C7.32814 8.16602 8.36915 7.14454 9.65236 7.14454C10.9365 7.14454 11.9776 8.16602 11.9776 9.42579ZM18.9512 11.707C20.2354 11.707 21.2764 10.6856 21.2764 9.42579C21.2764 8.16602 20.2354 7.14454 18.9512 7.14454C17.668 7.14454 16.627 8.16602 16.627 9.42579C16.627 10.6856 17.668 11.707 18.9512 11.707ZM21.2764 18.5215C21.2764 19.7813 20.2354 20.8027 18.9512 20.8027C17.668 20.8027 16.627 19.7813 16.627 18.5215C16.627 17.2617 17.668 16.2402 18.9512 16.2402C20.2354 16.2402 21.2764 17.2617 21.2764 18.5215Z"
            fill="#EFEFEF"
          />
        </svg>
      </div>
    );
  }
}
