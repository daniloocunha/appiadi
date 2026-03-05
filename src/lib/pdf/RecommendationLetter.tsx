import {
  Document, Page, Text, View, StyleSheet, Image
} from '@react-pdf/renderer'
import type { Member, Congregation } from '@/types'
import { formatDate, formatCPF } from '@/utils/formatters'

const PASTOR_NAME = 'Pr. José Ramos Filho'
const PASTOR_CREDENTIALS = 'CEADEB 5.898 | CGADB 37087'

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
    marginBottom: 8,
    borderBottom: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 15,
    gap: 15,
  },
  logo: { width: 60, height: 60 },
  headerText: { flex: 1 },
  churchName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  churchSub: { fontSize: 8, color: '#475569', marginTop: 1.5 },
  letterNumber: { fontSize: 9, color: '#94a3b8', marginTop: 4 },
  verse: {
    fontSize: 7.5,
    color: '#1e3a8a',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#1e3a8a',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    fontSize: 11,
    lineHeight: 2,
    textAlign: 'justify',
    marginBottom: 20,
  },
  bold: { fontFamily: 'Helvetica-Bold' },

  // ── Caixa de identificação do membro ──
  memberBox: {
    borderWidth: 1,
    borderColor: '#1e3a8a',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#f0f4ff',
  },
  memberBoxTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  memberBoxRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 3,
  },
  memberBoxField: {
    flex: 1,
    flexDirection: 'column',
  },
  memberBoxLabel: {
    fontSize: 7,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  memberBoxValue: {
    fontSize: 10,
    color: '#1e293b',
    fontFamily: 'Helvetica-Bold',
  },

  signatureSection: { marginTop: 50, alignItems: 'center' },
  signatureImg: { width: 120, height: 66, objectFit: 'contain', marginBottom: 2 },
  signatureLine: {
    borderTop: 1,
    borderTopColor: '#1e293b',
    width: 250,
    marginBottom: 5,
  },
  signatureText: { fontSize: 10, textAlign: 'center', color: '#475569' },
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
  issuedAt: string
}

export function RecommendationLetterPDF({
  member,
  congregation,
  letterNumber,
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
            <Text style={styles.churchName}>Igreja Evangélica Assembleia de Deus</Text>
            <Text style={styles.churchSub}>{congregation?.name ?? 'IADI'} — {city} — BA</Text>
            <Text style={styles.churchSub}>Rua Tiradentes, 211, Centro | CEP 46.860-000 | {congregation?.phone ?? '(71) 9.9982-9980'}</Text>
            <Text style={styles.churchSub}>CNPJ 04.889.243/0001-83 | assembleiadedeusiacu1919@gmail.com</Text>
            <Text style={styles.churchSub}>Pastor Presidente: José Ramos Filho | {PASTOR_CREDENTIALS}</Text>
            <Text style={styles.letterNumber}>Carta Nº {letterNumber}</Text>
          </View>
        </View>

        <Text style={styles.verse}>
          "Não esqueçais da hospitalidade, porque por ela alguns, não sabendo, hospedaram anjos" — Hebreus 13:2
        </Text>

        <Text style={styles.title}>Carta de Recomendação</Text>
        <Text style={styles.dateText}>{city}, {dateStr}</Text>

        {/* Caixa de identificação do membro */}
        <View style={styles.memberBox}>
          <Text style={styles.memberBoxTitle}>Identificação do Membro</Text>
          <View style={styles.memberBoxRow}>
            <View style={styles.memberBoxField}>
              <Text style={styles.memberBoxLabel}>Nome</Text>
              <Text style={styles.memberBoxValue}>{member.full_name}</Text>
            </View>
          </View>
          <View style={styles.memberBoxRow}>
            <View style={styles.memberBoxField}>
              <Text style={styles.memberBoxLabel}>Congregação / Sede</Text>
              <Text style={styles.memberBoxValue}>{congregation?.name ?? '—'}</Text>
            </View>
            <View style={styles.memberBoxField}>
              <Text style={styles.memberBoxLabel}>Departamento / Ministério</Text>
              <Text style={styles.memberBoxValue}>{member.ministry ?? member.church_role ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* Corpo */}
        <Text style={styles.body}>
          {'        '}A quem possa interessar:{'\n\n'}
          {'        '}A liderança da{' '}
          <Text style={styles.bold}>Igreja Evangélica Assembleia de Deus — {congregation?.name ?? 'IADI'}</Text>
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
          <Image src="/assinatura-pastor.png" style={styles.signatureImg} />
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{PASTOR_NAME}</Text>
          <Text style={styles.signatureText}>Pastor Presidente | {PASTOR_CREDENTIALS}</Text>
          <Text style={styles.signatureText}>Igreja Evangélica Assembleia de Deus — {city} — BA | CGADB</Text>
        </View>

        <Text style={styles.footer}>
          Documento emitido em {dateStr} — {letterNumber} — Sistema de Gestão IADI
        </Text>
      </Page>
    </Document>
  )
}
