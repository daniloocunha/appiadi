// Re-exporta apenas utilitários de upload de foto para o formulário público.
// Não re-exporta submitPublicRegistration aqui — importe diretamente de
// '@/hooks/useSelfRegistrations' para evitar importação circular.
export { uploadRegistrationPhoto, uploadMemberPhoto } from './photoUpload'
