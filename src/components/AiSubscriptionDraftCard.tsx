import { formatMoney } from '../lib/currency';
import { useI18n } from '../lib/i18n';
import type { SubscriptionDraft } from '../lib/aiSubscriptionImport';

type Props = {
  draft: SubscriptionDraft;
  isSaving: boolean;
  onAdd: () => void;
  onCancel: () => void;
};

export function AiSubscriptionDraftCard({ draft, isSaving, onAdd, onCancel }: Props) {
  const { locale } = useI18n();

  return (
    <article className="ai-draft-card">
      <div>
        <span>Найдена подписка</span>
        <strong>{draft.name}</strong>
      </div>
      <dl>
        <div>
          <dt>Сумма</dt>
          <dd>{formatMoney(draft.cost, draft.currency, locale)}</dd>
        </div>
        <div>
          <dt>Дата</dt>
          <dd>{draft.chargeDate}</dd>
        </div>
        <div>
          <dt>Уверенность</dt>
          <dd>{Math.round(draft.confidence * 100)}%</dd>
        </div>
      </dl>
      <p>{draft.note}</p>
      <div className="ai-draft-actions">
        <button type="button" onClick={onAdd} disabled={isSaving}>
          {isSaving ? 'Добавляю...' : 'Добавить'}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving}>
          Отмена
        </button>
      </div>
    </article>
  );
}
