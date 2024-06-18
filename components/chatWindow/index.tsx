import { SettingOutlined } from "@ant-design/icons";
import { Button, Card, Input } from "antd";
import axios from "axios";
import { FC, Fragment, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import Message from "./Message";

interface ChatWindowProps {
  className?: string;
}

interface MessageItem {
  question?: string;
  reply?: string;
  references?: { id: number; content: string; page_num: number }[];
}

const ChatWindow: FC<ChatWindowProps> = ({ className }) => {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();
  const chatWindowRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Card
        style={{ width: 500 }}
        className={className}
        title="Chat with PDF"
        bordered={false}
      >
        <div
          ref={chatWindowRef}
          className="scroll-smooth flex flex-col max-h-screen items-start flex-1 overflow-y-auto px-6"
        >
          {messages.map((item, index) => (
            <Fragment key={index}>
              {item.role === "user" ? (
                <Message isQuestion text={item.content} />
              ) : (
                <Message
                  loading={isLoading && index === messages.length - 1}
                  text={item.content}
                />
              )}
            </Fragment>
          ))}
        </div>

        <div className="p-4 pb-0 border-t border-t-gray-200 border-solid border-x-0 border-b-0">
          {/* give me a text box and a submit buttonin a form using tailwindcss */}
          <form onSubmit={handleSubmit}>
            <Input
              size="large"
              value={input}
              placeholder="input your question"
              allowClear
              onChange={handleInputChange}
            />
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="mt-2 bg-blue-400
            "
            >
              Submit
            </Button>
          </form>
        </div>
      </Card>
    </>
  );
};

export default ChatWindow;
