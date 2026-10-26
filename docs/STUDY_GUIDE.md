# Study Guide: CareMate ko apna kaise banayein

Yeh project tabhi tumhara hai jab tum har file samajh ke explain kar sako. Interviewer kisi bhi file ko khol ke poochega "yeh line kyun likhi?". Is guide ko order mein follow karo.

---

## Step 0: JavaScript basics pehle (Week 1 to 2)

Project ki koi file kholne se pehle **javascript.info** ke yeh chapters karo:

| Topic | Project mein kahan dikhega |
|---|---|
| `let` / `const`, arrow functions | Har file |
| Destructuring `const { a, b } = obj` | `routes/*.js`, saare components |
| Spread `...` | `cartSlice.js`, `store.js` |
| `map`, `filter`, `reduce`, `find`, `some` | `routes/doctors.js`, `services/pricing.js` |
| Template strings `` `${x}` `` | `utils/format.js` |
| Closures | `middleware/security.js` (`createLoginLimiter`), `data/store.js` |
| Promises, `async/await` | `routes/auth.js` |
| ES modules `import` / `export` | Har file |
| Event loop | Interview ka favourite sawaal |

---

## Step 1: Backend padho (is order mein)

Backend chhota hai aur pure JavaScript hai, isliye yahin se shuru karo.

1. **`server/src/utils/validate.js`**: Simple functions. `isValidDate` dekho: regex se shape check, phir `Date` se check ki date asli mein exist karti hai.
2. **`server/src/services/slots.js`**: `"09:30"` ko minutes mein badalna aur wapas. Lunch break skip hota hai. Python jaisa logic hai.
3. **`server/src/services/pricing.js`**: `map` aur `reduce` se order total. Samjho ki price server pe kyun calculate hoti hai.
4. **`server/src/data/store.js`**: **Closure** ka real example. `userData` bahar se access nahi ho sakta, sirf `insert` aur `update` se.
5. **`server/src/app.js`**: Express kaise middleware chain banata hai. Order matter karta hai: pehle `express.json()`, phir session, phir routes, last mein error handler.
6. **`server/src/routes/auth.js`**: bcrypt, session regenerate, login limiter.
7. **`server/src/routes/consultations.js`**: Booking ka poora flow.

**Khud karke dekho:**
- `npm run server` chalao, phir browser mein `http://localhost:4000/api/doctors?speciality=Cardiology&sort=fee_asc` kholo.
- `server/test/api.test.js` padho. Har test ek feature batata hai.
- **Ek feature khud add karo:** doctors ko `minRating` se filter karna (`?minRating=4.5`). `filterDoctors` mein ek line, aur ek test.

---

## Step 2: React basics (Week 3)

react.dev ka official tutorial ("Tic-Tac-Toe" aur "Thinking in React") karo. Phir yeh files padho:

| File | Kya seekhoge |
|---|---|
| `components/ui/Button.jsx` | Props, default values, `...rest` |
| `components/ui/Feedback.jsx` | Chhote reusable components |
| `components/ui/Field.jsx` | `useId`, label ko input se jodna (accessibility) |
| `components/ui/QuantityStepper.jsx` | Controlled component: value parent ke paas hai |
| `hooks/useDebouncedValue.js` | `useEffect` + cleanup. **Interview mein debounce zaroor poochte hain** |
| `features/auth/AuthForm.jsx` | Form state, validation, submit |
| `components/ui/Modal.jsx` | `useRef`, `useEffect`, portals, keyboard handling |

---

## Step 3: Redux Toolkit (Week 4)

1. **`features/cart/cartSlice.js`**: `createSlice`, reducers, actions. Immer ki wajah se "mutate" jaisa likh sakte ho.
2. **`app/store.js`**: `configureStore`, aur cart ko localStorage mein save karna.
3. **`services/api.js`**: RTK Query. Har endpoint ek hook banata hai (`useGetDoctorsQuery`). **Tags** samjho: `bookConsultation` `Slots` tag invalidate karta hai, toh slot list khud refresh ho jaati hai.
4. **`features/cart/CartPage.jsx`**: `useSelector` aur `useDispatch` dono ek saath.

**Redux DevTools** Chrome extension install karo. App chalao aur har action live dekho.

---

## Step 4: Bade pages (Week 5)

- **`features/doctors/DoctorsPage.jsx`**: URL search params, debounce, virtualization. Sabse zyada "senior" cheezein yahin hain.
- **`features/doctors/DoctorDetailPage.jsx`** + **`BookingDialog.jsx`**: Booking flow.
- **`features/bookings/BookingsPage.jsx`**: Custom hook `useCancelConfirmation`, tabs with arrow keys.
- **`features/home/AvailabilityBoard.jsx`**: Polling (`pollingInterval`), loading skeleton, `<table>` ko accessible rakhna, aur poori row clickable banane ki CSS trick (`::after`).
- **`components/layout/CommandPalette.jsx`**: Keyboard se chalne wala search. `aria-activedescendant` padho: focus input mein rehta hai, phir bhi screen reader ko pata hai kaunsa option selected hai.
- **`hooks/useHotkey.js`** aur **`hooks/useClinicClock.js`**: Event listeners, timers aur unka cleanup. Clock agle minute pe exactly kaise sync hoti hai, samjho.
- **`services/api.js`** ka `baseQueryWithSessionCheck`: Ek jagah se poori app ka 401 handle karna.

## Step 5: Design system (Week 6)

`styles/global.css` ke top pe tokens hain (colors, type scale, radius). Interview mein design poochein toh yeh bolna: "Ek hi bold element hai, LED board. Baaki site shaant hai. Radius hierarchy dikhata hai: board sabse soft, controls sabse tight." README ka Design section padho.

---

## Interview mein yeh sawaal aayenge (project se jude)

Har ek ka jawab apne shabdon mein likh ke rakho.

1. Login ke baad user logged-in kaise rehta hai? (Cookie, session id, server pe session)
2. JWT in localStorage vs httpOnly cookie: tumne kya chuna aur kyun?
3. CSRF kya hai aur tumne kaise roka? (`SameSite=Lax` + JSON-only writes)
4. Session fixation kya hai? `req.session.regenerate` kyun?
5. Do log ek saath same slot book karein toh kya hoga?
6. Price client se kyun nahi lete?
7. 500 doctors ki list smooth kaise chalti hai? Virtualization kya hai?
8. `React.memo` kab kaam aata hai, kab nahi?
9. Debounce aur throttle mein kya fark hai? Debounce khud likh ke dikhao.
10. RTK Query cache kaise invalidate hota hai?
11. Lazy loading / code splitting kya hai? `React.lazy` + `Suspense`.
12. `new Date("2026-10-26")` se kya problem aa sakti hai? (UTC vs local)
13. Modal ko accessible banane ke liye kya kiya?
14. Redux mein cart aur RTK Query mein bookings, aisa split kyun?

---

## Isko aur strong banane ke liye (tumhare khud ke kaam)

Yeh features tum khud add karo. Interview mein "maine yeh khud banaya" bolna sabse powerful hota hai.

1. **TypeScript migration**: Pehle `utils/` folder ko `.ts` mein badlo.
2. **AngularJS admin panel**: MediBuddy JD mein AngularJS pehli requirement hai. Bookings ki list aur status change karne wala chhota admin page banao.
3. **Micro frontend**: Admin panel ko single-spa ya Module Federation se jodo.
4. **Lighthouse score** nikalo aur README mein bharo. Phir kuch improve karo aur before/after likho.
5. **Deploy karo**: Frontend Vercel pe, backend Render pe. Live link resume pe daalo.
6. **Prescription upload**: File upload (multer) + order status update.

---

## Ek zaroori baat

Resume pe likhte waqt honest raho. Agar interview mein poochein ki AI tools use kiye ya nahi, toh sach bolo: "Structure aur code banane mein AI ki help li, phir maine har file padhi, test chalaye, aur X, Y, Z features khud add kiye." Aaj kal companies AI tools ka use expect karti hain. Jo pakda jaata hai woh yeh hai ki candidate apna hi code explain nahi kar paata.
