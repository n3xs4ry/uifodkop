import { Auth } from '../components/Auth';

const elonPhotoUrl =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Colorado_2022.jpg/960px-Elon_Musk_Colorado_2022.jpg';

export function AuthPage() {
  return (
    <section className="auth-layout">
      <div className="auth-form-column">
        <Auth />
      </div>
      <aside className="auth-quote-card" aria-label="Придуманная цитата Илона Маска">
        <img src={elonPhotoUrl} alt="Илон Маск на выступлении в 2022 году" />
        <div className="auth-quote-overlay">
          <span>Придуманная цитата</span>
          <blockquote>
            “Sub Tracker бережёт мои деньги для Марса. Это лучшая кнопка "Добавить карту", которую я нажимал”
          </blockquote>
          <p>Илон Маск, если бы тестировал Sub Tracker</p>
        </div>
      </aside>
    </section>
  );
}
