import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
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
    borderBottomColor: '#7c3aed',
    paddingBottom: 15,
    gap: 15,
  },
  logo: { width: 60, height: 60 },
  headerText: { flex: 1 },
  churchName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
  },
  churchSub: { fontSize: 9, color: '#475569', marginTop: 2 },
  letterNumber: { fontSize: 9, color: '#94a3b8', marginTop: 4 },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#7c3aed',
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
  bold: { fontFamily: 'Helvetica-Bold' },
  destinationBox: {
    backgroundColor: '#f5f3ff',
    borderLeft: 3,
    borderLeftColor: '#7c3aed',
    padding: 10,
    marginBottom: 20,
  },
  destinationLabel: {
    fontSize: 9,
    color: '#6d28d9',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  destinationText: { fontSize: 11, color: '#1e293b' },
  signatureSection: { marginTop: 50, alignItems: 'center' },
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

interface TransferLetterProps {
  member: Member
  congregation: Congregation | null
  letterNumber: string
  pastorName: string
  issuedAt: string
  destination: string
  destinationCity: string
}

export function TransferLetterPDF({
  member,
  congregation,
  letterNumber,
  pastorName,
  issuedAt,
  destination,
  destinationCity,
}: TransferLetterProps) {
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
            <Text style={styles.churchSub}>{congregation?.phone ?? ''}</Text>
            <Text style={styles.letterNumber}>Carta Nº {letterNumber}</Text>
          </View>
        </View>

        <Text style={styles.title}>Carta de Transferência</Text>

        <Text style={styles.dateText}>{city}, {dateStr}</Text>

        {/* Destino */}
        <View style={styles.destinationBox}>
          <Text style={styles.destinationLabel}>DESTINATÁRIO</Text>
          <Text style={styles.destinationText}>
            {destination} — {destinationCity}
          </Text>
        </View>

        {/* Corpo */}
        <Text style={styles.body}>
          {'        '}Ao(À) Rev.(ma) Pastor(a) e demais líderes da{' '}
          <Text style={styles.bold}>{destination}</Text>
          {',\n\n'}
          {'        '}A liderança da{' '}
          <Text style={styles.bold}>
            Igreja Evangélica Assembleia de Deus — {congregation?.name ?? 'IADI'}
          </Text>
          {', sediada em '}
          <Text style={styles.bold}>{city} — BA</Text>
          {', apresenta a V. Revª. o(a) irmão(ã) '}
          <Text style={styles.bold}>{member.full_name}</Text>
          {', portador(a) do CPF '}
          <Text style={styles.bold}>{member.cpf ? formatCPF(member.cpf) : 'não informado'}</Text>
          {', batizado(a) nas águas em '}
          <Text style={styles.bold}>
            {member.baptism_date ? formatDate(member.baptism_date, 'long') : 'data não informada'}
          </Text>
          {', que tem se mantido em boa comunhão nesta Igreja, e, a pedido próprio, está se transferindo para essa congregação.'}
          {'\n\n'}
          {'        '}Pedimos que o(a) receba em comunhão com toda a fraternidade cristã, esperando que Deus o(a) abençoe grandemente em seu novo campo de serviço.
          {'\n\n'}
          {'        '}Fraternalmente em Cristo.
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

        <Text style={styles.footer}>
          Documento emitido em {dateStr} — {letterNumber} — Sistema de Gestão IADI
        </Text>
      </Page>
    </Document>
  )
}
