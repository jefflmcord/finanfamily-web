'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, Shield, Trash2, UserPlus, X } from 'lucide-react';
import { API_URL, authenticatedFetch } from '@/lib/apiClient';

type PermissionKey =
  | 'family_read'
  | 'transactions_create'
  | 'transactions_edit'
  | 'transactions_delete'
  | 'transactions_settle'
  | 'cards_manage'
  | 'categories_manage'
  | 'goals_manage';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: 'OWNER' | 'MEMBER';
  permissions: Partial<Record<PermissionKey, boolean>>;
}

interface Invitation {
  email: string;
  created_at: string;
  expires_at: string;
}

const PERMISSIONS: { key: PermissionKey; label: string }[] = [
  { key: 'family_read', label: 'Consultar informações da família' },
  { key: 'transactions_create', label: 'Lançar contas a pagar e receber' },
  { key: 'transactions_edit', label: 'Editar lançamentos' },
  { key: 'transactions_settle', label: 'Baixar pagamentos e recebimentos' },
  { key: 'transactions_delete', label: 'Excluir lançamentos' },
  { key: 'cards_manage', label: 'Cadastrar, editar e excluir cartões' },
  { key: 'categories_manage', label: 'Gerenciar categorias' },
  { key: 'goals_manage', label: 'Gerenciar metas de investimento' },
];

const DEFAULT_PERMISSIONS: Record<PermissionKey, boolean> = {
  family_read: true,
  transactions_create: true,
  transactions_edit: false,
  transactions_delete: false,
  transactions_settle: true,
  cards_manage: false,
  categories_manage: false,
  goals_manage: false,
};

export default function FamilyMembersManager() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersResponse, invitationsResponse] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/family/members`),
        authenticatedFetch(`${API_URL}/api/family/invitations`),
      ]);
      const [memberData, invitationData] = await Promise.all([
        membersResponse.json(),
        invitationsResponse.json(),
      ]);
      if (!membersResponse.ok) throw new Error(memberData.error || 'Não foi possível carregar os membros.');
      if (!invitationsResponse.ok) throw new Error(invitationData.error || 'Não foi possível carregar os convites.');
      setMembers(memberData);
      setInvitations(invitationData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar membros da família.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function createInvitation(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    setShareUrl('');
    try {
      const response = await authenticatedFetch(`${API_URL}/api/family/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, permissions }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível criar o convite.');
      setShareUrl(`${window.location.origin}/aceitar-convite?token=${encodeURIComponent(data.token)}`);
      setEmail('');
      setNotice('Convite criado. Copie e compartilhe o link com a pessoa convidada. Ele expira em 7 dias.');
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Erro ao criar convite.');
    } finally {
      setSaving(false);
    }
  }

  async function updatePermissions(member: FamilyMember, key: PermissionKey, enabled: boolean) {
    const updatedPermissions = { ...member.permissions, [key]: enabled };
    setError('');
    try {
      const response = await authenticatedFetch(`${API_URL}/api/family/members/${member.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updatedPermissions }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar as permissões.');
      setMembers(current => current.map(item =>
        item.id === member.id ? { ...item, permissions: updatedPermissions } : item
      ));
      setNotice(`Permissões de ${member.name} atualizadas.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Erro ao atualizar permissões.');
    }
  }

  async function removeMember(member: FamilyMember) {
    if (!window.confirm(`Remover ${member.name} da família?`)) return;
    setError('');
    try {
      const response = await authenticatedFetch(`${API_URL}/api/family/members/${member.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível remover o membro.');
      setNotice(`${member.name} foi removido da família.`);
      await loadData();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Erro ao remover membro.');
    }
  }

  async function revokeInvitation(invitation: Invitation) {
    if (!window.confirm(`Revogar o convite enviado para ${invitation.email}?`)) return;
    setError('');
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/family/invitations/${encodeURIComponent(invitation.email)}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível revogar o convite.');
      setNotice(`Convite para ${invitation.email} revogado.`);
      await loadData();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Erro ao revogar convite.');
    }
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice('Link copiado. Compartilhe-o somente com a pessoa convidada.');
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione e copie o link manualmente.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">Membros da família</h2>
        <p className="mt-1 text-sm text-slate-400">Convide pessoas usando o e-mail delas e controle o que podem fazer.</p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}

      <form onSubmit={createInvitation} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <h3 className="flex items-center gap-2 font-bold text-white"><UserPlus className="h-5 w-5 text-emerald-400" />Convidar membro</h3>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-slate-400">E-mail do familiar</span>
          <input
            type="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="familiar@exemplo.com"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-bold uppercase text-slate-400">Permissões</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PERMISSIONS.map(permission => (
              <label key={permission.key} className="flex min-h-11 items-center gap-3 rounded-xl bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={permissions[permission.key]}
                  onChange={event => setPermissions(current => ({ ...current, [permission.key]: event.target.checked }))}
                  className="h-4 w-4 accent-emerald-500"
                />
                {permission.label}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={saving}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-extrabold text-slate-950 disabled:opacity-60 sm:w-auto"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
          Gerar convite
        </button>
        {shareUrl && (
          <div className="space-y-2 rounded-2xl border border-emerald-500/20 bg-slate-950 p-4">
            <label htmlFor="family-invite-link" className="text-xs font-bold uppercase text-emerald-300">Link de convite (uso único)</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input id="family-invite-link" readOnly value={shareUrl} className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200" />
              <button type="button" onClick={copyInviteLink} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950">
                <Copy className="h-4 w-4" />Copiar link
              </button>
            </div>
          </div>
        )}
      </form>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 font-bold text-white"><Shield className="h-5 w-5 text-emerald-400" />Pessoas vinculadas</h3>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>
        ) : members.map(member => (
          <article key={member.id} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-emerald-300">
                    {member.name.slice(0, 1).toLocaleUpperCase('pt-BR')}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{member.name}{member.role === 'OWNER' ? ' (Responsável)' : ''}</p>
                  <p className="truncate text-xs text-slate-400">{member.email}</p>
                </div>
              </div>
              {member.role === 'MEMBER' && (
                <button type="button" onClick={() => removeMember(member)} aria-label={`Remover ${member.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {member.role === 'MEMBER' && (
              <div className="grid grid-cols-1 gap-2 border-t border-slate-800 pt-3 sm:grid-cols-2">
                {PERMISSIONS.map(permission => (
                  <label key={permission.key} className="flex min-h-10 items-center gap-3 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={member.permissions?.[permission.key] === true}
                      onChange={event => updatePermissions(member, permission.key, event.target.checked)}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    {permission.label}
                  </label>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>

      {invitations.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-bold text-white">Convites pendentes</h3>
          {invitations.map(invitation => (
            <article key={invitation.email} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{invitation.email}</p>
                <p className="text-xs text-slate-400">Expira em {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <button type="button" onClick={() => revokeInvitation(invitation)} className="flex min-h-10 items-center gap-2 rounded-xl bg-slate-800 px-3 text-xs font-bold text-rose-300">
                <X className="h-4 w-4" />Revogar
              </button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
