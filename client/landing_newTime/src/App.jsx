import "./App.css";
import { useState, useEffect } from "react";
import { getOrder, addOrder, getTotalQuantity, getLastUpdated, shipOrder } from "./api/order";
import image from "./assets/image.png";
import logoImage from "./assets/logoNewTime.png";
// import heroImage from "./assets/images1.png";
// import imageBig from "./assets/images2.png";

const ADMIN_PASSWORD = "myGodisJesus"; // пароль

export default function App() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
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

  const [shipData, setShipData] = useState({ orderNumber: "", quantity: "" });
  const [shipping, setShipping] = useState(false);

  const [activeTab, setActiveTab] = useState("add");

  // Загружаем общее количество при старте
  useEffect(() => {
    getTotalQuantity().then(total => {
      setTotalQuantity(total);
    });
  }, []);

    useEffect(() => {
      getLastUpdated().then(date => setLastUpdated(date));
}, []);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const orderFromUrl = params.get("order");
  if (orderFromUrl) {
    setCode(orderFromUrl);
    // автоматически проверить заказ
    getOrder(orderFromUrl).then(data => setResult(data)).catch(() => {
      setResult({ status: "error", quantity: 0 });
    });
  }
}, []);

  // Анимация счётчика
  useEffect(() => {
    if (totalQuantity === 0) return;

    let start = 0;
    const duration = 1000; // 1 секунда
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
  <div className="admin-tabs-wrapper">
    {/* ВКЛАДКИ */}
    <div className="admin-tabs">
      <button
        className={`tab-btn ${activeTab === "add" ? "active" : ""}`}
        onClick={() => setActiveTab("add")}
      >
        Добавить
      </button>
      <button
        className={`tab-btn ${activeTab === "ship" ? "active" : ""}`}
        onClick={() => setActiveTab("ship")}
      >
        Отгрузка
      </button>
    </div>

    {/* ФОРМА ДОБАВЛЕНИЯ */}
    {activeTab === "add" && (
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

    {/* ФОРМА ОТГРУЗКИ */}
    {activeTab === "ship" && (
      <div className="ship-form">
        <p>Отгрузка пакетов</p>
        <input
          placeholder="Номер заявки"
          value={shipData.orderNumber}
          onChange={(e) => setShipData({ ...shipData, orderNumber: e.target.value })}
        />
        <input
          placeholder="Количество к отгрузке"
          value={shipData.quantity}
          onChange={(e) => setShipData({ ...shipData, quantity: e.target.value })}
        />
        <button
          onClick={async () => {
            if (!shipData.orderNumber || !shipData.quantity) {
              alert("Заполните все поля");
              return;
            }
            try {
              setShipping(true);
              const remaining = await shipOrder(shipData.orderNumber, shipData.quantity);
              alert(`Отгружено! Остаток: ${remaining} пакетов`);
              setShipData({ orderNumber: "", quantity: "" });
              await refreshTotal();
            } catch {
              alert("Заказ не найден");
            } finally {
              setShipping(false);
            }
          }}
          disabled={shipping}
        >
          {shipping ? "Обработка..." : "Отгрузить"}
        </button>
      </div>
    )}
  </div>
)}

      {/* RIGHT ICONS */}
      <div className="right-icons">
        {/* <div className="icon big">
          <img src={imageBig} alt="Main" />
        </div> */}
        <div className="icon">
          <img src={logoImage} alt="Main" />
        </div>
        {/* // <div className="icon light">
        //   <img src={heroImage} alt="Main" />
        // </div> */}
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