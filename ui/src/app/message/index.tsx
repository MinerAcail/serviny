import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const SEND_MESSAGE = gql`
  mutation sendChatMessage($input: ChatMessageInput!, $orderId: String) {
    sendChatMessage(input: $input, orderId: $orderId) {
      id
      orderId
      sender
      content
    }
  }
`;

const GET_CHAT = gql`
  query getOrderChat($orderId: String) {
    getOrderChat(orderId: $orderId) {
      orderId
      messages {
        id
        sender
        content
      }
    }
  }
`;

type Message = {
  id: number;
  sender: "CUSTOMER" | "VENDOR";
  content: string;
};

type ChatData = {
  getOrderChat: {
    orderId: string;
    messages: Message[];
  };
};

export default function MinChat({id}:{id:string|null}) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // console.log("id",id);
  
  // const rawOrderId = localStorage.getItem("foodie_last_order_id");
  const orderId = id ? id?.replace(/^"|"$/g, "").trim() : null;
  const sanitizedOrderId = orderId && orderId?.length > 0 ? orderId : null;

  // Scroll to the latest message
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Fetch chat messages
  const { data, loading, error } = useQuery<ChatData>(GET_CHAT, {
    variables: { orderId: sanitizedOrderId },
    pollInterval: sanitizedOrderId ? 5000 : undefined,
    skip: !sanitizedOrderId,
  });

  // Apollo Mutation to send messages with cache update
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    update(cache, { data }) {
      const newMessage = data?.sendChatMessage;
      const existingChat = cache.readQuery<ChatData>({
        query: GET_CHAT,
        variables: { orderId: sanitizedOrderId },
      });

      if (existingChat && newMessage) {
        cache.writeQuery({
          query: GET_CHAT,
          variables: { orderId: sanitizedOrderId },
          data: {
            getOrderChat: {
              ...existingChat.getOrderChat,
              messages: [...existingChat.getOrderChat.messages, newMessage],
            },
          },
        });
      }
    },
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [data?.getOrderChat.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage({
        variables: {
          input: { sender: "CUSTOMER", content: newMessage.trim() },
          orderId: sanitizedOrderId,
        },
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading chat: {error.message}</div>;

  let messages = data?.getOrderChat.messages || [];

  // Add vendor greeting if there are no messages
  if (messages.length === 0) {
    messages = [
      {
        id: -1,
        sender: "VENDOR",
        content: "You Shop in Comfort, We Deliver with Speed. Please we'll attend to you shortly. 😊",
      },
    ];
  }

  return (
    <Card className="w-full max-w-md mx-auto h-[450px] flex flex-col">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <ScrollArea ref={scrollAreaRef} className="h-[300px] pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "CUSTOMER"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.sender === "CUSTOMER"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
