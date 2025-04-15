import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text
} from '@react-email/components';

export function VerifyEmailTemplate({ verificationCode }: { verificationCode: string }) {
  return (
    <Html lang="pt-BR">
      <Tailwind>
        <Head>
          <title>Confirme seu email - Despensa</title>
          <Preview>Confirme seu email para começar a usar o Despensa</Preview>
        </Head>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] mx-auto p-[20px] max-w-[600px]">
            <Section className="mt-[32px]">
              <Heading className="text-[24px] font-bold text-center text-gray-800 m-0">
                Bem-vindo ao Despensa!
              </Heading>

              <Text className="text-[16px] text-gray-600 mt-[16px] mb-[24px]">Olá,</Text>

              <Text className="text-[16px] text-gray-600 mb-[12px]">
                Obrigado por se cadastrar no Despensa, o aplicativo que vai te ajudar a gerenciar
                sua despensa de forma prática e eficiente.
              </Text>

              <Text className="text-[16px] text-gray-600 mb-[24px]">
                Para começar a usar todos os recursos do Despensa, por favor confirme seu endereço
                de email clicando no botão abaixo:
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  className="bg-emerald-600 text-white font-bold py-[12px] px-[24px] rounded-[4px] no-underline text-center box-border"
                  href={`https://app.despensa.com.br/verificar?token=${verificationCode}`}
                >
                  Confirmar meu email
                </Button>
              </Section>

              <Text className="text-[14px] text-gray-600 mb-[12px]">
                Se você não solicitou esta verificação, pode ignorar este email com segurança.
              </Text>

              <Text className="text-[14px] text-gray-600 mb-[24px]">
                O link de confirmação expira em 24 horas. Caso o botão acima não funcione, copie e
                cole o link abaixo no seu navegador:
              </Text>

              <Text className="text-[14px] text-gray-500 mb-[32px] break-all">
                {`https://app.despensa.com.br/verificar?token=${verificationCode}`}
              </Text>

              <Text className="text-[16px] text-gray-600 mb-[8px]">Atenciosamente,</Text>

              <Text className="text-[16px] font-bold text-gray-800 mb-[32px]">Equipe Despensa</Text>
            </Section>

            <Section className="border-t border-gray-200 pt-[20px] text-center">
              <Text className="text-[12px] text-gray-500 m-0">
                © {new Date().getFullYear()} Despensa. Todos os direitos reservados.
              </Text>
              <Text className="text-[12px] text-gray-500 m-0">
                Rua Exemplo, 123, São Paulo - SP, 01234-567
              </Text>
              <Text className="text-[12px] text-gray-500 mt-[8px]">
                <a
                  href="https://app.despensa.com.br/preferencias"
                  className="text-emerald-600 no-underline"
                >
                  Preferências de email
                </a>{' '}
                •
                <a
                  href="https://app.despensa.com.br/cancelar-inscricao"
                  className="text-emerald-600 no-underline ml-[4px]"
                >
                  Cancelar inscrição
                </a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
