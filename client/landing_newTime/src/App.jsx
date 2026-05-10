import "./App.css";
import { useState, useEffect } from "react";
import { getOrder, addOrder, getTotalQuantity, getLastUpdated } from "./api/order";
import image from "./assets/image.png";
import logoImage from "./assets/logo.png";
import heroImage from "./assets/hero.png";
import imageBig from "./assets/imageBig.png";

const ADMIN_PASSWORD = "myGodisJesus"; // ← задайте свой пароль

export default function App() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrder, setNewOrder] = useState({
    orderNumber: "",
    package: "",
    status: "",
    quantity: ""
  });

  // Админ-режим
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

    // Счётчик
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);

  // Загружаем общее количество при старте
  useEffect(() => {
    getTotalQuantity().then(total => {
      setTotalQuantity(total);
    });
  }, []);

  const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
      getLastUpdated().then(date => setLastUpdated(date));
}, []);

  // Анимация счётчика
  useEffect(() => {
    if (totalQuantity === 0) return;

    let start = 0;
    const duration = 1000; // 2 секунды
    const stepTime = 16; // ~60fps
    const steps = duration / stepTime;
    const increment = totalQuantity / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= totalQuantity) {
        setDisplayCount(totalQuantity);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [totalQuantity]);

  // Обновляем счётчик после добавления заказа
  const refreshTotal = async () => {
    const total = await getTotalQuantity();
    setDisplayCount(0);
    setTotalQuantity(0);
    setTimeout(() => setTotalQuantity(total), 50);
  };

  const handleAdminLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordInput(false);
      setPasswordInput("");
    } else {
      alert("Не угадал");
      setPasswordInput("");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setShowPasswordInput(false);
    setPasswordInput("");
  };

  const createOrder = async () => {
    const orderNumber = Number(newOrder.orderNumber);
    if (Number.isNaN(orderNumber) || newOrder.orderNumber === "") {
      alert("Некорректный номер заявки");
      return;
    }
    try {
      setCreating(true);
      await addOrder({
        orderNumber: Number(orderNumber),
        package: newOrder.package,
        status: newOrder.status,
        quantity: Number(newOrder.quantity) || 0
      });
      alert("Заказ добавлен");
      setNewOrder({ orderNumber: "", package: "", status: "", quantity: "" });
      await refreshTotal(); // обновляем счётчик
    } finally {
      setCreating(false);
    }
  };

  const checkOrder = async () => {
    if (code.trim().length !== 4) {
      alert("Введите 4-значный код");
      return;
    }
    try {
      setLoading(true);
      const data = await getOrder(code);
      setResult(data);
    } catch {
      setResult({ status: "error", quantity: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
    <div className="app">
      {/* LEFT LOGO */}
      <div className="logo-block">
        <img src={image} alt="Main" />
        <div className="logo-glow"></div>
      </div>

      {/* CENTER CONTENT */}
      <div className="center">
        <h1>ПРОВЕРКА <br /> ЗАКАЗА</h1>
        <p className="subtitle">
          Введите номер заявки и получите статус продукции
        </p>
        <div className="form">
          <input
            type="text"
            maxLength={4}
            placeholder="0000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="check-btn" onClick={checkOrder}>
            {loading ? "Загрузка..." : "Проверить"}
          </button>
        </div>
        {result && (
          <div className="result">
            {result.status === "error"
              ? <p>Заказ не найден</p>
              : <p>
                  Размер: {result.package || "неизвестно"} <br />
                  Статус: {result.status} {result.quantity}
                </p>
            }
          </div>
        )}

        {/* КНОПКА ВХОДА ДЛЯ АДМИНА */}
        <div className="admin-login">
          {!isAdmin && !showPasswordInput && (
            <button
              className="admin-toggle-btn"
              onClick={() => setShowPasswordInput(true)}
            >
              Войти как администратор
            </button>
          )}
          {!isAdmin && showPasswordInput && (
            <div className="admin-password-form">
              <input
                type="password"
                placeholder="Введите пароль"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              />
              <button onClick={handleAdminLogin}>Войти</button>
              <button onClick={() => setShowPasswordInput(false)}>Отмена</button>
            </div>
          )}
          {isAdmin && (
            <button className="admin-toggle-btn" onClick={handleAdminLogout}>
              Выйти из режима администратора
            </button>
          )}
        </div>

        {/* СЧЁТЧИК ВНИЗУ */}
        <div className="total-counter">
          <p className="total-label">Всего готово пакетов</p>
          <p className="total-number">{displayCount.toLocaleString()}</p>
        </div>
      </div>

      {/* ADMIN FORM */}
      {isAdmin && (
        <div className="form">
          <input
            placeholder="Номер заявки"
            value={newOrder.orderNumber}
            onChange={(e) => setNewOrder({ ...newOrder, orderNumber: e.target.value })}
          />
          <input
            placeholder="Размер пакета"
            value={newOrder.package}
            onChange={(e) => setNewOrder({ ...newOrder, package: e.target.value })}
          />
          <input
            placeholder="Статус"
            value={newOrder.status}
            onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
          />
          <input
            placeholder="Количество"
            value={newOrder.quantity}
            onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
          />
          <button onClick={createOrder} disabled={creating}>
            {creating ? "Сохранение..." : "Добавить заказ"}
          </button>
        </div>
      )}

      {/* RIGHT ICONS */}
      <div className="right-icons">
        <div className="icon big">
          <img src={imageBig} alt="Main" />
        </div>
        <div className="icon">
          <img src={logoImage} alt="Main" />
        </div>
        <div className="icon light">
          <img src={heroImage} alt="Main" />
        </div>
      </div>
    </div>
          {/* FOOTER */}
      <div className="footer">
        {lastUpdated && (
          <p>Последнее обновление {lastUpdated.toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'numeric'
          })} в {lastUpdated.toLocaleTimeString('ru-RU', {
            hour: '2-digit', minute: '2-digit'
          })}</p>
        )}
      </div>
</div>
  );
}