import { Auth } from '../components/Auth';
import elonPhoto from '../assets/elon-musk-auth.jpg';

export function AuthPage() {
  return (
    <section className="auth-layout">
      <div className="auth-form-column">
        <Auth />
      </div>
      <aside className="auth-quote-card" aria-label="Цитата на промо-блоке">
        <img src={elonPhoto} alt="Илон Маск" />
        <div className="auth-quote-overlay">
          <blockquote>
            “Sub Tracker бережёт мои деньги для Марса. Это лучшая кнопка "Добавить карту", которую я нажимал”
          </blockquote>
        </div>
      </aside>
    </section>
  );
}
