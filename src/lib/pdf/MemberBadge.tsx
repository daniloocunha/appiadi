import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { Member, Congregation } from '@/types'
import { formatCPF } from '@/utils/formatters'

// Crachá horizontal: ~92mm × 63mm (formato paisagem)
// Página A4 retrato: frente (2 crachás) + verso (2 crachás) com separador tracejado

const PASTOR_NAME = 'Pr. José Ramos Filho'

const BADGE_W  = 258   // ~91mm
const BADGE_H  = 174   // ~61mm
const PHOTO_SZ = 76    // foto circular
const PAGE_PAD = 20

function todayDisplay() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `Iaçu-BA, ${dd}/${mm}/${yyyy}`
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

const MARITAL: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  separado: 'Separado(a)',
}

const styles = StyleSheet.create({
  page: {
    width: 595,
    height: 842,
    padding: PAGE_PAD,
    backgroundColor: '#f1f5f9',
    flexDirection: 'column',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
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
    marginVertical: 4,
  },

  // ══════════════════════════════
  // FRENTE (horizontal)
  // ══════════════════════════════
  front: {
    width: BADGE_W,
    height: BADGE_H,
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'column',
  },

  frontHeader: {
    width: '100%',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#172554',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  headerTexts: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 5.5,
    color: '#93c5fd',
    letterSpacing: 0.8,
  },

  // Corpo horizontal: foto à esquerda + info à direita
  frontBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },

  photoRing: {
    width: PHOTO_SZ + 6,
    height: PHOTO_SZ + 6,
    borderRadius: (PHOTO_SZ + 6) / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: '#93c5fd',
  },

  memberInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 3,
  },
  memberName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    lineHeight: 1.35,
  },
  memberRole: {
    fontSize: 7.5,
    color: '#bfdbfe',
  },
  memberCong: {
    fontSize: 6.5,
    color: '#93c5fd',
  },

  amberStripe: {
    width: '100%',
    height: 8,
    backgroundColor: '#f59e0b',
  },

  // ══════════════════════════════
  // VERSO (horizontal)
  // ══════════════════════════════
  back: {
    width: BADGE_W,
    height: BADGE_H,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    flexDirection: 'column',
  },

  backHeader: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backLogo: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  backChurchName: {
    flex: 1,
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    lineHeight: 1.4,
  },
  idBox: {
    backgroundColor: '#172554',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
    minWidth: 36,
  },
  idLabel: {
    fontSize: 4.5,
    color: '#93c5fd',
    letterSpacing: 0.4,
  },
  idValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },

  // Corpo em 2 colunas
  backBody: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 8,
  },
  backCol: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
  },
  field: {
    flexDirection: 'column',
    gap: 0.5,
  },
  fieldLabel: {
    fontSize: 5,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: 'Helvetica-Bold',
  },
  fieldValue: {
    fontSize: 6.5,
    color: '#1e293b',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
  },

  backDivider: {
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
  },
  signatureArea: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  signatureImg: {
    width: 70,
    height: 38,
    objectFit: 'contain',
    marginBottom: 1,
  },
  signatureLine: {
    width: 76,
    borderTopWidth: 0.5,
    borderTopColor: '#334155',
    marginBottom: 1,
  },
  signatureText: {
    fontSize: 5,
    color: '#64748b',
    textAlign: 'center',
  },
  genDate: {
    fontSize: 5.5,
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
}

// ── Frente horizontal ──────────────────────────────────────
function BadgeFront({ member, congregation }: Pick<BadgeProps, 'member' | 'congregation'>) {
  const initials = getInitials(member.full_name)
  return (
    <View style={styles.front}>
      {/* Cabeçalho */}
      <View style={styles.frontHeader}>
        <Image src="/novologo.png" style={styles.headerLogo} />
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>IADI</Text>
          <Text style={styles.headerSub}>IAÇU — BAHIA</Text>
        </View>
      </View>

      {/* Corpo: foto + info */}
      <View style={styles.frontBody}>
        <View style={styles.photoRing}>
          {member.photo_url ? (
            <Image src={member.photo_url} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.full_name}</Text>
          <Text style={styles.memberRole}>{member.church_role ?? 'Membro'}</Text>
          {congregation && (
            <Text style={styles.memberCong}>{congregation.name}</Text>
          )}
        </View>
      </View>

      {/* Faixa âmbar */}
      <View style={styles.amberStripe} />
    </View>
  )
}

// ── Verso horizontal ──────────────────────────────────────
function BadgeBack({ member, congregation, badgeNumber }: BadgeProps) {
  const memberNum = member.member_number
    ? `#${String(member.member_number).padStart(4, '0')}`
    : badgeNumber

  const maritalLabel = member.marital_status ? (MARITAL[member.marital_status] ?? member.marital_status) : '—'

  return (
    <View style={styles.back}>
      {/* Cabeçalho azul */}
      <View style={styles.backHeader}>
        <Image src="/novologo.png" style={styles.backLogo} />
        <Text style={styles.backChurchName}>
          Igreja Assembleia de Deus{'\n'}Iaçu — BA
        </Text>
        <View style={styles.idBox}>
          <Text style={styles.idLabel}>Nº</Text>
          <Text style={styles.idValue}>{memberNum}</Text>
        </View>
      </View>

      {/* Campos em 2 colunas */}
      <View style={styles.backBody}>
        {/* Coluna esquerda */}
        <View style={styles.backCol}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Congregação</Text>
            <Text style={styles.fieldValue}>{congregation?.name ?? '—'}</Text>
          </View>
          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={styles.fieldLabel}>Naturalidade</Text>
              <Text style={styles.fieldValue}>{member.naturalidade ?? '—'}</Text>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>UF</Text>
              <Text style={styles.fieldValue}>{member.naturalidade_uf ?? '—'}</Text>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Data de Nascimento</Text>
            <Text style={styles.fieldValue}>{fmtDate(member.birth_date)}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Estado Civil</Text>
            <Text style={styles.fieldValue}>{maritalLabel}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Cônjuge</Text>
            <Text style={styles.fieldValue}>{member.spouse_name ?? '—'}</Text>
          </View>
        </View>

        {/* Coluna direita */}
        <View style={styles.backCol}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nome do Pai</Text>
            <Text style={styles.fieldValue}>{member.father_name ?? '—'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nome da Mãe</Text>
            <Text style={styles.fieldValue}>{member.mother_name ?? '—'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Data de Batismo</Text>
            <Text style={styles.fieldValue}>{fmtDate(member.baptism_date)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Cargo</Text>
              <Text style={styles.fieldValue}>{member.church_role ?? '—'}</Text>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Ministério</Text>
              <Text style={styles.fieldValue}>{member.ministry ?? '—'}</Text>
            </View>
          </View>
          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>RG</Text>
              <Text style={styles.fieldValue}>{member.rg ?? '—'}</Text>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>CPF</Text>
              <Text style={styles.fieldValue}>{member.cpf ? formatCPF(member.cpf) : '—'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Assinatura + data de geração */}
      <View style={styles.backDivider} />
      <View style={styles.signatureArea}>
        <View>
          <Image src="/assinatura-pastor.png" style={styles.signatureImg} />
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{PASTOR_NAME}</Text>
          <Text style={styles.signatureText}>Pastor Presidente</Text>
        </View>
        <Text style={styles.genDate}>{todayDisplay()}</Text>
      </View>

      {/* Faixa âmbar */}
      <View style={styles.amberStripe} />
    </View>
  )
}

// ── Documento: 2 crachás horizontais por linha ────────────
export function MemberBadgePDF({ member, congregation, badgeNumber }: BadgeProps) {
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
          <BadgeBack member={member} congregation={congregation} badgeNumber={badgeNumber} />
          <BadgeBack member={member} congregation={congregation} badgeNumber={badgeNumber} />
        </View>

        <Text style={styles.instruction}>
          Dois crachás por página — recorte na linha tracejada
        </Text>
      </Page>
    </Document>
  )
}
