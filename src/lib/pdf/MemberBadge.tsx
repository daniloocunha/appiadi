import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { Member, Congregation } from '@/types'
import { formatCPF } from '@/utils/formatters'

// Crachá vertical: ~67mm × 96mm (formato retrato)
// Página A4: 2 crachás lado a lado — frente + verso separados para plastificação

const BADGE_W  = 190   // ~67mm
const BADGE_H  = 272   // ~96mm
const PHOTO_SZ = 120   // foto circular centralizada
const PAGE_PAD = 32

const styles = StyleSheet.create({
  page: {
    width: 595,
    height: 842,
    padding: PAGE_PAD,
    backgroundColor: '#f1f5f9',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  instruction: {
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8',
  },
  instructionBold: {
    textAlign: 'center',
    fontSize: 7,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  separator: {
    borderTopWidth: 1,
    borderTopStyle: 'dashed',
    borderTopColor: '#94a3b8',
    marginVertical: 2,
  },

  // ══════════════════════════════
  // FRENTE
  // ══════════════════════════════
  front: {
    width: BADGE_W,
    height: BADGE_H,
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // Cabeçalho (faixa azul-escura)
  frontHeader: {
    width: '100%',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#172554',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  headerLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  headerTexts: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 6,
    color: '#93c5fd',
    letterSpacing: 0.8,
  },

  // Foto circular com anel branco
  photoRing: {
    marginTop: 14,
    width: PHOTO_SZ + 8,
    height: PHOTO_SZ + 8,
    borderRadius: (PHOTO_SZ + 8) / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: PHOTO_SZ,
    height: PHOTO_SZ,
    borderRadius: PHOTO_SZ / 2,
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: PHOTO_SZ,
    height: PHOTO_SZ,
    borderRadius: PHOTO_SZ / 2,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontSize: 38,
    fontFamily: 'Helvetica-Bold',
    color: '#93c5fd',
  },

  // Dados do membro
  memberInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    gap: 4,
  },
  memberName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 1.35,
  },
  memberRole: {
    fontSize: 8,
    color: '#bfdbfe',
    textAlign: 'center',
  },
  memberCong: {
    fontSize: 7,
    color: '#93c5fd',
    textAlign: 'center',
  },

  // Faixa âmbar inferior
  amberStripe: {
    width: '100%',
    height: 9,
    backgroundColor: '#f59e0b',
  },

  // ══════════════════════════════
  // VERSO
  // ══════════════════════════════
  back: {
    width: BADGE_W,
    height: BADGE_H,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    flexDirection: 'column',
  },

  backHeader: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  backChurchName: {
    flex: 1,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    lineHeight: 1.4,
  },
  idBox: {
    backgroundColor: '#172554',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
    alignItems: 'center',
    minWidth: 42,
  },
  idLabel: {
    fontSize: 5,
    color: '#93c5fd',
    letterSpacing: 0.5,
  },
  idValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },

  backFields: {
    flex: 1,
    padding: 10,
    gap: 7,
  },
  field: {
    flexDirection: 'column',
    gap: 1,
  },
  fieldLabel: {
    fontSize: 6,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Helvetica-Bold',
  },
  fieldValue: {
    fontSize: 8,
    color: '#1e293b',
  },

  backDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  signatureArea: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  signatureLine: {
    width: 88,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginBottom: 2,
  },
  signatureText: {
    fontSize: 6,
    color: '#64748b',
    textAlign: 'center',
  },
  badgeRef: {
    fontSize: 6,
    color: '#94a3b8',
    textAlign: 'right',
  },
})

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

interface BadgeProps {
  member: Member
  congregation: Congregation | null
  badgeNumber: string
  pastorName: string
}

// ── Frente ──────────────────────────────────────────────
function BadgeFront({ member, congregation }: Pick<BadgeProps, 'member' | 'congregation'>) {
  const initials = getInitials(member.full_name)
  return (
    <View style={styles.front}>
      {/* Cabeçalho */}
      <View style={styles.frontHeader}>
        <Image src="/logo.png" style={styles.headerLogo} />
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>IADI</Text>
          <Text style={styles.headerSub}>IAÇU — BAHIA</Text>
        </View>
      </View>

      {/* Foto circular */}
      <View style={styles.photoRing}>
        {member.photo_url ? (
          <Image src={member.photo_url} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoInitials}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Nome + cargo + congregação */}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.full_name}</Text>
        <Text style={styles.memberRole}>{member.church_role ?? 'Membro'}</Text>
        {congregation && (
          <Text style={styles.memberCong}>{congregation.name}</Text>
        )}
      </View>

      {/* Faixa âmbar */}
      <View style={styles.amberStripe} />
    </View>
  )
}

// ── Verso ────────────────────────────────────────────────
function BadgeBack({ member, badgeNumber, pastorName }: Omit<BadgeProps, 'congregation'>) {
  const memberNum = member.member_number
    ? `#${String(member.member_number).padStart(4, '0')}`
    : badgeNumber

  return (
    <View style={styles.back}>
      {/* Cabeçalho azul */}
      <View style={styles.backHeader}>
        <Image src="/logo.png" style={styles.backLogo} />
        <Text style={styles.backChurchName}>
          Igreja Evang.{'\n'}Assembleia de Deus{'\n'}Iaçu — BA
        </Text>
        <View style={styles.idBox}>
          <Text style={styles.idLabel}>Nº</Text>
          <Text style={styles.idValue}>{memberNum}</Text>
        </View>
      </View>

      {/* Campos */}
      <View style={styles.backFields}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nome Completo</Text>
          <Text style={styles.fieldValue}>{member.full_name}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>RG</Text>
          <Text style={styles.fieldValue}>{member.rg ?? '—'}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>CPF</Text>
          <Text style={styles.fieldValue}>{member.cpf ? formatCPF(member.cpf) : '—'}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nome do Pai</Text>
          <Text style={styles.fieldValue}>{member.father_name ?? '—'}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nome da Mãe</Text>
          <Text style={styles.fieldValue}>{member.mother_name ?? '—'}</Text>
        </View>
        {member.ministry ? (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Ministério</Text>
            <Text style={styles.fieldValue}>{member.ministry}</Text>
          </View>
        ) : null}
      </View>

      {/* Assinatura */}
      <View style={styles.backDivider} />
      <View style={styles.signatureArea}>
        <View>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{pastorName}</Text>
          <Text style={styles.signatureText}>Pastor Presidente</Text>
        </View>
        <Text style={styles.badgeRef}>{badgeNumber}</Text>
      </View>

      {/* Faixa âmbar */}
      <View style={styles.amberStripe} />
    </View>
  )
}

// ── Documento: 2 crachás verticais por página A4 ─────────
export function MemberBadgePDF({ member, congregation, badgeNumber, pastorName }: BadgeProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.instruction}>
          Imprima em papel resistente ou cartolina — Recorte e plastifique
        </Text>

        <Text style={styles.instructionBold}>▼  FRENTE</Text>
        <View style={styles.row}>
          <BadgeFront member={member} congregation={congregation} />
          <BadgeFront member={member} congregation={congregation} />
        </View>

        <View style={styles.separator} />

        <Text style={styles.instructionBold}>▼  VERSO</Text>
        <View style={styles.row}>
          <BadgeBack member={member} badgeNumber={badgeNumber} pastorName={pastorName} />
          <BadgeBack member={member} badgeNumber={badgeNumber} pastorName={pastorName} />
        </View>

        <Text style={styles.instruction}>
          Dois crachás por página — recorte na linha tracejada
        </Text>
      </Page>
    </Document>
  )
}
