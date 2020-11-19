import UploadOutlined from "@ant-design/icons/lib/icons/UploadOutlined";
import Button from "antd/lib/button";
import DatePicker from "antd/lib/date-picker";
import Divider from "antd/lib/divider";
import Form, { FormInstance } from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import notification from "antd/lib/notification";
import Tabs from "antd/lib/tabs";
import Upload from "antd/lib/upload";
import Popover from "antd/lib/popover";
import message from "antd/lib/message";
// @ts-ignore
import window from "global/window";
// @ts-ignore
import omitBy from "lodash.omitby";
import moment from "moment";
import { t } from "onefx/lib/iso-i18n";
import React, { Component, useState, useEffect, useRef } from "react";
import OutsideClickHandler from "react-outside-click-handler";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { styled } from "styletron-react";
import { TContact2 } from "../../../types/human";
import { CommonMargin } from "../../common/common-margin";
import { Flex } from "../../common/flex";
import { TOP_BAR_HEIGHT } from "../../common/top-bar";
import { upload } from "../../common/upload";
import { getContacts } from "../../contacts/data/queries";
import { actionUpdateHuman } from "../human-reducer";
import PhoneInput from "../phone-input";
import { formatToE164 } from "../phone-input/util";
import DynamicFormItems from "./dynamic-form-items";
import { ExperienceForm } from "./experience-form";
import { ObservationForm } from "./observation-form";
import { useDeleteContact } from "./hooks/useDeleteContact";

const { TabPane } = Tabs;

const fileTypes = ["jpg", "jpeg", "png", "bmp", "tif", "tiff", "gif"];

export const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 }
  },
  colon: false
};

export function ProfileEditorContainer({
  human
}: {
  human: TContact2;
}): JSX.Element {
  const dispatch = useDispatch();
  const history = useHistory();
  const [visible, setVisible] = useState(false);
  const formRef = useRef<FormInstance>();
  useEffect(() => {
    setVisible(history.location.pathname.endsWith("/edit/"));
  }, []);

  const close = (): void => {
    setVisible(false);
    window.setTimeout(() => history.push("../"), 200);
  };

  const onOk = (): void => {
    if (!actionUpdateHuman) {
      return;
    }

    if (!formRef.current) {
      return;
    }

    formRef.current
      .validateFields()
      .then(result => {
        const clone = {
          ...human,
          ...result,
          // @ts-ignore
          emails: result.emails.split(","),
          experience: (result.experience || []).filter((e: any) => e),
          education: (result.education || []).filter((e: any) => e),
          // Remove the next line codes if it's no need to handle the old contacts
          // created before the phones features was added. This makes the phone input
          // ui rendered with the old contacts look like more reasonable.
          phones: (result.phones || []).filter((e: any) => e)
        };
        window.console.log(clone);
        dispatch(
          actionUpdateHuman(
            omitBy(clone, (val: any) => val === null),
            false
          )
        );

        close();
      })
      .catch(({ errorFields }: { errorFields: any }) => {
        if (formRef.current) {
          formRef.current.scrollToField(errorFields[0].name);
        }
      });
  };

  return (
    <Modal
      style={{ top: TOP_BAR_HEIGHT }}
      title={t("edit")}
      visible={visible}
      onOk={onOk}
      onCancel={close}
      width={600}
    >
      <ProfileEditorForm human={human} ref={formRef} />
    </Modal>
  );
}

// eslint-disable-next-line react/display-name
export const ProfileEditorForm = React.forwardRef(
  ({ human }: { human: TContact2 }, ref: any) => {
    return (
      <Form
        ref={ref}
        initialValues={{
          phones: human.phones,
          name: human.name,
          emails: (human.emails || []).join(", "),
          avatarUrl: human.avatarUrl,
          address: human.address,
          bornAt: human.bornAt && moment(human.bornAt),
          bornAddress: human.bornAddress,
          facebook: human.facebook,
          linkedin: human.linkedin,
          github: human.github,
          knownAt: moment(human.knownAt),
          knownSource: human.knownSource,
          blurb: human.blurb,
          workingOn: human.workingOn,
          desire: human.desire,
          experience: human.experience,
          education: human.education,
          inboundTrust: human.inboundTrust,
          outboundTrust: human.outboundTrust,
          extraversionIntroversion: human.extraversionIntroversion,
          intuitingSensing: human.intuitingSensing,
          thinkingFeeling: human.thinkingFeeling,
          planingPerceiving: human.planingPerceiving,
          tdp: human.tdp
        }}
      >
        <Tabs defaultActiveKey="1">
          <TabPane forceRender tab={t("profile_editor.pii")} key="1">
            <PersonalForm human={human} formRef={ref} />
          </TabPane>
          <TabPane forceRender tab={t("profile_editor.experience")} key="2">
            <ExperienceForm />
          </TabPane>
          <TabPane forceRender tab={t("profile_editor.observation")} key="3">
            <ObservationForm />
          </TabPane>
        </Tabs>
      </Form>
    );
  }
);

interface PersonalFormState {
  avatarUrl: string;
}

class PersonalForm extends Component<
  {
    human: TContact2;
    formRef: any;
  },
  PersonalFormState
> {
  state: PersonalFormState = { avatarUrl: "" };

  renderPhoneNumbers(): JSX.Element | null {
    return (
      <DynamicFormItems
        name="phones"
        label={t("field.phone")}
        renderItem={field => (
          <Form.Item
            {...field}
            rules={[
              {
                validator(_: any, val: any): Promise<string | void> {
                  if (val && formatToE164(val || "").length < 9) {
                    return Promise.reject(t("field.error.phone.format"));
                  }
                  return Promise.resolve();
                }
              }
            ]}
            getValueFromEvent={event => {
              if (event.value === `+${event.callingCode}`) {
                return "";
              }
              return event.value;
            }}
            noStyle
          >
            <PhoneInput />
          </Form.Item>
        )}
      />
    );
  }

  actionCheckFileType = (file: File) => {
    const extName = file.name.split(".").slice(-1)[0];
    if (extName && !fileTypes.includes(extName)) {
      return Promise.reject(message.error(t("profile_editor.upload.fileType")));
    }
    return Promise.resolve();
  };

  actionUploadImage = async ({ file, onSuccess }: any) => {
    const { formRef } = this.props;

    const fieldName = "avatarUrl";
    const data = await upload(file, fieldName);
    if (formRef && formRef.current) {
      formRef.current.setFieldsValue({
        [fieldName]: data.secure_url
      });
      this.setState({ [fieldName]: data.secure_url });
      return Promise.resolve(onSuccess(data, file));
    }
    return Promise.reject();
  };

  render(): JSX.Element | null {
    const { human } = this.props;

    return (
      <>
        <Form.Item
          {...formItemLayout}
          label={t("field.name")}
          rules={[
            {
              required: true,
              message: t("field.error.required.name")
            }
          ]}
          name="name"
        >
          <Input placeholder={t("field.jane_doe")} />
        </Form.Item>

        {this.renderPhoneNumbers()}

        <Form.Item {...formItemLayout} label={t("field.emails")} name="emails">
          <Input placeholder={t("field.emails")} />
        </Form.Item>

        <Form.Item {...formItemLayout} label={t("field.avatar_url")}>
          <Form.Item name="avatarUrl" noStyle>
            <Input hidden={true} />
          </Form.Item>
          <Upload
            beforeUpload={this.actionCheckFileType}
            customRequest={this.actionUploadImage}
          >
            {human.avatarUrl ? (
              <img
                alt="avatar"
                style={{ width: "50%", cursor: "pointer" }}
                src={this.state.avatarUrl || human.avatarUrl}
              />
            ) : (
              <Button>
                <UploadOutlined />
                <span>{t("profile_editor.upload")}</span>
              </Button>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={t("field.address")}
          name="address"
        >
          <Input placeholder={t("field.address")} />
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={t("field.dateOfBirth")}
          name="bornAt"
        >
          <DatePicker placeholder={t("field.dateOfBirth")} />
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={t("field.birthplace")}
          name="bornAddress"
        >
          <Input placeholder={t("field.birthplace")} />
        </Form.Item>

        <SocialNetworkForm />

        <SourceForm />
        {human._id && (
          <DeleteContactPopover
            // @ts-ignore
            name={human.name}
            contactId={String(human._id)}
          />
        )}
      </>
    );
  }
}

export function DeleteContactPopover({
  name,
  contactId
}: {
  name: string;
  contactId: string;
}): JSX.Element {
  const [visible, setVisible] = useState(false);
  const history = useHistory();
  const [deleteContact, { loading }] = useDeleteContact();

  const content = (
    <OutsideClickHandler onOutsideClick={() => setVisible(false)}>
      <PopoverContent>
        <div>{t(t("field.delete_contact.content"), { name })}</div>
        <CommonMargin />
        <div>
          <Flex justifyContent="flex-start">
            {(() => {
              return (
                // @ts-ignore
                <Button
                  danger
                  loading={loading}
                  onClick={async () => {
                    try {
                      await deleteContact({
                        refetchQueries: [
                          {
                            query: getContacts
                          }
                        ],
                        variables: { id: contactId }
                      });
                      history.push("/contacts/");
                      notification.success({
                        message: t("field.delete_contact.deleted", {
                          name
                        })
                      });
                    } catch (e) {
                      const filtered = String(e).replace(
                        "Error: GraphQL error:",
                        ""
                      );
                      notification.error({
                        message: t("field.delete_contact.failed", {
                          e: filtered
                        })
                      });
                    }
                  }}
                >
                  {t("field.delete_contact.yes")}
                </Button>
              );
            })()}
            <CommonMargin />
            <Button onClick={() => setVisible(false)}>
              {t("field.delete_contact.cancel")}
            </Button>
          </Flex>
        </div>
      </PopoverContent>
    </OutsideClickHandler>
  );
  return (
    <Popover
      visible={visible}
      trigger="click"
      content={content}
      title={t("field.delete_contact.title")}
    >
      <Button onClick={() => setVisible(true)}>{t("delete")}</Button>
    </Popover>
  );
}

const PopoverContent = styled("div", {
  maxWidth: "350px"
});

function SocialNetworkForm(): JSX.Element | null {
  return (
    <>
      <Divider>{t("social_network")}</Divider>
      <Form.Item
        {...formItemLayout}
        label={t("field.facebook")}
        name="facebook"
      >
        <Input />
      </Form.Item>

      <Form.Item
        {...formItemLayout}
        label={t("field.linkedin")}
        name="linkedin"
      >
        <Input />
      </Form.Item>

      <Form.Item {...formItemLayout} label={t("field.github")} name="github">
        <Input />
      </Form.Item>
    </>
  );
}

function SourceForm(): JSX.Element | null {
  return (
    <>
      <Divider>{t("source")}</Divider>
      <Form.Item {...formItemLayout} label={t("field.known_at")} name="knownAt">
        <DatePicker />
      </Form.Item>

      <Form.Item
        {...formItemLayout}
        label={t("field.known_source")}
        name="knownSource"
      >
        <Input />
      </Form.Item>
    </>
  );
}
