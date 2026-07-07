import { notFound } from "next/navigation";
import { EditPersonalClient } from "../EditPersonalClient";
import { getPersonalById } from "@/actions/personal";

import { Flex, Text } from "@chakra-ui/react";
import { AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPersonalPage({ params }: Props) {
  const { id } = await params;

  const data = await getPersonalById(id);

  if ("error" in data) {
    if (data.status === 404 || data.status === 401) {
      return notFound();
    }

    return (
      <Flex minH="100vh" bg="#08080a" align="center" justify="center" p={6}>
        <Flex
          direction="column"
          align="center"
          gap={3}
          bg="#18181b"
          p={8}
          borderRadius="xl"
          border="1px solid"
          borderColor="red.900"
        >
          <AlertCircle color="#f87171" size={48} />
          <Text color="red.400" fontWeight="bold">
            {data.error}
          </Text>
        </Flex>
      </Flex>
    );
  }

  return <EditPersonalClient user={data.user}/>
}
