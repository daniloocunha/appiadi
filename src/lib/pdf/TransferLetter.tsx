import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { Member, Congregation } from '@/types'
import { formatDate, formatCPF } from '@/utils/formatters'

const PASTOR_NAME = 'Pr. José Ramos Filho'
const PASTOR_CREDENTIALS = 'CEADEB 5.898 | CGADB 37087'

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1e293b',
    lineHeight: 1.6,
  },
  // 04. Centralizado, logo maior, espaçamento reduzido
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 6,
    borderBottom: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 10,
  },
  logo: { width: 68, height: 68, marginBottom: 4 }, // 04. logo maior
  headerText: { alignItems: 'center' },
  // 01. Nome da igreja maior
  churchName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  // 04. Espaçamento reduzido entre linhas do cabeçalho
  churchSub: { fontSize: 7.5, color: '#475569', marginTop: 0.5, textAlign: 'center' },
  letterNumber: { fontSize: 8.5, color: '#94a3b8', marginTop: 2, textAlign: 'center' },
  verse: {
    fontSize: 7.5,
    color: '#1d4ed8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#1e3a8a',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    textAlign: 'center',
    color: '#1d4ed8',
    marginBottom: 8,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.7,
    textAlign: 'justify',
    marginBottom: 10,
  },
  bold: { fontFamily: 'Helvetica-Bold' },
  destinationBox: {
    backgroundColor: '#eff6ff',
    borderLeft: 3,
    borderLeftColor: '#1e3a8a',
    padding: 8,
    marginBottom: 10,
  },
  // 06. Título Destinatário maior
  destinationLabel: {
    fontSize: 10.5,
    color: '#1d4ed8',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  destinationText: { fontSize: 10.5, color: '#1e293b' },

  // ── Caixa de identificação do membro ──
  memberBox: {
    borderWidth: 1,
    borderColor: '#1e3a8a',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
    backgroundColor: '#f0f4ff',
  },
  // 06. Título Identificação do Membro maior
  memberBoxTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3, // 05. menos espaço abaixo do título
  },
  // 05. Espaçamento reduzido entre linhas de dados
  memberBoxRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 1,
  },
  memberBoxField: {
    flex: 1,
    flexDirection: 'column',
  },
  memberBoxLabel: {
    fontSize: 6.5,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  memberBoxValue: {
    fontSize: 9.5,
    color: '#1e293b',
    fontFamily: 'Helvetica-Bold',
  },

  // 07. Validade centralizada
  validityBox: {
    backgroundColor: '#fffbeb',
    borderTop: 1,
    borderBottom: 1,
    borderTopColor: '#f59e0b',
    borderBottomColor: '#f59e0b',
    padding: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  validityText: { fontSize: 8.5, color: '#92400e', textAlign: 'center' },

  signatureSection: { marginTop: 20, alignItems: 'center' },
  signatureImg: { width: 110, height: 60, objectFit: 'contain', marginBottom: 2 },
  signatureLine: {
    borderTop: 1,
    borderTopColor: '#1e293b',
    width: 240,
    marginBottom: 4,
  },
  signatureText: { fontSize: 9.5, textAlign: 'center', color: '#475569' },
  dateText: {
    fontSize: 10,
    textAlign: 'right',
    color: '#475569',
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    fontSize: 7.5,
    color: '#94a3b8',
    textAlign: 'center',
  },
})

interface TransferLetterProps {
  member: Member
  congregation: Congregation | null
  letterNumber: string
  issuedAt: string
  destination: string
  destinationCity: string
}

export function TransferLetterPDF({
  member,
  congregation,
  letterNumber,
  issuedAt,
  destination,
  destinationCity,
}: TransferLetterProps) {
  const city = congregation?.city ?? 'Iaçu'
  const dateStr = formatDate(issuedAt, 'long')
  const phone = congregation?.phone ?? '(71) 9.9982-9980'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho — 04. centralizado, logo maior, espaçamento reduzido */}
        <View style={styles.header}>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.headerText}>
            {/* 01. Nome da igreja maior */}
            <Text style={styles.churchName}>Igreja Evangélica Assembleia de Deus</Text>
            {/* 02. Congregação removida daqui; 03. "SEDE - " no endereço */}
            <Text style={styles.churchSub}>SEDE - Rua Tiradentes, 211, Centro | CEP 46.860-000 | {phone}</Text>
            <Text style={styles.churchSub}>CNPJ 04.889.243/0001-83 | assembleiadedeusiacu1919@gmail.com</Text>
            <Text style={styles.churchSub}>Pastor Presidente: José Ramos Filho | {PASTOR_CREDENTIALS}</Text>
            <Text style={styles.letterNumber}>Carta Nº {letterNumber}</Text>
          </View>
        </View>

        <Text style={styles.verse}>
          "Não esqueçais da hospitalidade, porque por ela alguns, não sabendo, hospedaram anjos" — Hebreus 13:2
        </Text>

        <Text style={styles.title}>Carta de Mudança</Text>
        <Text style={styles.subtitle}>Apresentação de Membro</Text>
        <Text style={styles.dateText}>{city}, {dateStr}</Text>

        {/* Destino */}
        <View style={styles.destinationBox}>
          <Text style={styles.destinationLabel}>DESTINATÁRIO</Text>
          <Text style={styles.destinationText}>{destination} — {destinationCity}</Text>
        </View>

        {/* Caixa de identificação do membro */}
        <View style={styles.memberBox}>
          <Text style={styles.memberBoxTitle}>Identificação do Membro</Text>
          <View style={styles.memberBoxRow}>
            <View style={styles.memberBoxField}>
              <Text style={styles.memberBoxLabel}>Nome Completo</Text>
              <Text style={styles.memberBoxValue}>{member.full_name}</Text>
            </View>
          </View>
          <View style={styles.memberBoxRow}>
            <View style={styles.memberBoxField}>
              <Text style={styles.memberBoxLabel}>Cargo / Função</Text>
              <Text style={styles.memberBoxValue}>{member.church_role ?? '—'}</Text>
            </View>
            <View style={styles.memberBoxField}>
              <Text style={styles.memberBoxLabel}>Departamento / Ministério</Text>
              <Text style={styles.memberBoxValue}>{member.ministry ?? '—'}</Text>
            </View>
            <View style={styles.memberBoxField}>
              <Text style={styles.memberBoxLabel}>Congregação / Sede</Text>
              <Text style={styles.memberBoxValue}>{congregation?.name ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* Corpo */}
        <Text style={styles.body}>
          {'        '}Saudações no Senhor!{'\n\n'}
          {'        '}É com muita satisfação que apresentamos à{' '}
          <Text style={styles.bold}>{destination} — {destinationCity}</Text>
          {', o(a) irmão(ã) '}
          <Text style={styles.bold}>{member.full_name}</Text>
          {', portador(a) do CPF '}
          <Text style={styles.bold}>{member.cpf ? formatCPF(member.cpf) : 'não informado'}</Text>
          {', batizado(a) nas águas em '}
          <Text style={styles.bold}>
            {member.baptism_date ? formatDate(member.baptism_date, 'long') : 'data não informada'}
          </Text>
          {'. O(A) referido(a) irmão(ã) é membro ativo desta Igreja, mantendo-se dentro dos princípios bíblicos e doutrinários, e tem sido fiel à sua caminhada cristã e ao ministério que lhe foi confiado.'}
          {'\n\n'}
          {'        '}Recomendamos que seja recebido(a) como usam fazer os santos, podendo assim continuar a servir na obra do SENHOR.
        </Text>

        {/* 07. Validade centralizada */}
        <View style={styles.validityBox}>
          <Text style={styles.validityText}>⚠ Validade: 30 dias a partir da data de emissão.</Text>
        </View>

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
