import {
  Document, Page, Text, View, StyleSheet, Image
} from '@react-pdf/renderer'
import type { Member, Congregation } from '@/types'
import { formatDate, formatCPF } from '@/utils/formatters'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1e293b',
    lineHeight: 1.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 15,
    gap: 15,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerText: {
    flex: 1,
  },
  churchName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  churchSub: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
  letterNumber: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#1e3a8a',
    marginBottom: 20,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    fontSize: 11,
    lineHeight: 2,
    textAlign: 'justify',
    marginBottom: 20,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  signatureSection: {
    marginTop: 50,
    alignItems: 'center',
  },
  signatureLine: {
    borderTop: 1,
    borderTopColor: '#1e293b',
    width: 250,
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#475569',
  },
  dateText: {
    fontSize: 10,
    textAlign: 'right',
    color: '#475569',
    marginBottom: 30,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
})

interface RecommendationLetterProps {
  member: Member
  congregation: Congregation | null
  letterNumber: string
  pastorName: string
  issuedAt: string
}

export function RecommendationLetterPDF({
  member,
  congregation,
  letterNumber,
  pastorName,
  issuedAt,
}: RecommendationLetterProps) {
  const city = congregation?.city ?? 'Iaçu'
  const dateStr = formatDate(issuedAt, 'long')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.churchName}>
              Igreja Evangélica Assembleia de Deus
            </Text>
            <Text style={styles.churchSub}>
              {congregation?.name ?? 'IADI'} — {city} — BA
            </Text>
            <Text style={styles.churchSub}>
              {congregation?.phone ?? ''}
            </Text>
            <Text style={styles.letterNumber}>Carta Nº {letterNumber}</Text>
          </View>
        </View>

        {/* Título */}
        <Text style={styles.title}>Carta de Recomendação</Text>

        {/* Data */}
        <Text style={styles.dateText}>
          {city}, {dateStr}
        </Text>

        {/* Corpo */}
        <Text style={styles.body}>
          {'        '}A quem possa interessar:{'\n\n'}
          {'        '}A liderança da{' '}
          <Text style={styles.bold}>
            Igreja Evangélica Assembleia de Deus — {congregation?.name ?? 'IADI'}
          </Text>
          {', sediada em '}
          <Text style={styles.bold}>{city} — BA</Text>
          {', vem por meio desta, recomendar o(a) irmão(ã) '}
          <Text style={styles.bold}>{member.full_name}</Text>
          {', portador(a) do CPF '}
          <Text style={styles.bold}>{member.cpf ? formatCPF(member.cpf) : 'não informado'}</Text>
          {', batizado(a) nas águas em '}
          <Text style={styles.bold}>
            {member.baptism_date ? formatDate(member.baptism_date, 'long') : 'data não informada'}
          </Text>
          {', que tem se mantido em comunhão ativa com esta Igreja, participando regularmente dos cultos e atividades da congregação.'}
          {'\n\n'}
          {'        '}Recomendamos o(a) referido(a) irmão(ã) como pessoa de boa índole moral e cristã, digno(a) de toda confiança, a ser recebido(a) em qualquer congregação desta ou de outras denominações.
          {'\n\n'}
          {'        '}Pedimos aos irmãos pastores e líderes que o(a) recebam com todo o amor e fraternal consideração.
        </Text>

        {/* Assinatura */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{pastorName}</Text>
          <Text style={styles.signatureText}>Pastor Presidente</Text>
          <Text style={styles.signatureText}>
            Igreja Evangélica Assembleia de Deus — {city} — BA
          </Text>
        </View>

        {/* Rodapé */}
        <Text style={styles.footer}>
          Documento emitido em {dateStr} — {letterNumber} — Sistema de Gestão IADI
        </Text>
      </Page>
    </Document>
  )
}
