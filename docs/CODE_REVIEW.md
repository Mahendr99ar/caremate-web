# Code Review

Pehla version banne ke baad poore code ka review kiya, browser mein end-to-end test chalaya, aur ESLint (React hooks rules) lagaya. Neeche woh issues hain jo mile aur unka fix. Har ek interview mein "maine yeh bug kaise pakda" story ban sakta hai.

## Bugs jo fix kiye

### 1. Logged-out user ke har page pe 401 error
**Kya dikha:** Browser test mein console 401 errors se bhara tha.
**Wajah:** `/api/auth/me` logged-out user ko 401 deta tha. RTK Query errors ko cache nahi karta, isliye har naye page pe dobara request jaati thi.
**Fix:** `/auth/me` ab `200 { user: null }` deta hai. "Login nahi hai" ek normal jawab hai, error nahi. (`server/src/routes/auth.js`)

### 2. Logout ke waqt kabhi kabhi 401
**Kya dikha:** Teen mein se ek test run mein ek 401 aata tha.
**Wajah:** Logout pe pehle cache reset hota tha, phir navigate. Beech mein Bookings page abhi bhi mounted tha, usne apna data dobara maanga aur 401 mila.
**Fix:** Pehle `navigate('/')`, phir cache reset. React dono updates ek render mein batch karta hai, toh page pehle hi hat jaata hai. (`Navbar.jsx`)

### 3. Back button ke baad search box khaali
**Kya dikha:** "sharma" search karo, doctor kholo, Back dabao: list filtered hai par search box khaali.
**Wajah:** Input ka state sirf pehli render pe URL se padha jaata tha.
**Fix:** `useRef` mein yaad rakha ki URL humne khud kab likha. URL kisi aur wajah se badle (Back/Forward), tabhi input update hota hai. Simple `useEffect` sync se ek race condition aa jaati jo tezi se type karne pe text mita deti. (`DoctorsPage.jsx`)

### 4. Virtualized list har render pe saari rows remount karti
**Wajah:** react-window `children` ko component ki tarah render karta hai. Inline arrow function har render pe naya component type hota, toh `React.memo` bekaar ho jaata.
**Fix:** Row renderer component ke bahar define kiya aur data `itemData` se pass kiya. (`DoctorsPage.jsx`)

### 5. Cart page pe khaali red error box
**Wajah:** `<Alert>{a}{b}</Alert>` mein children ek array ban jaata hai `[null, false]`, jo JavaScript mein truthy hai. Isliye Alert hamesha render hota tha.
**Fix:** Alert sirf `error` hone pe render hota hai. (`CartPage.jsx`)

### 6. Login fail hone pe unhandled promise rejection
**Wajah:** `onQueryStarted` mein `await queryFulfilled` bina try/catch ke tha. Galat password pe promise reject hota aur kahin handle nahi hota.
**Fix:** Login aur register dono ke liye ek shared `startFreshSession` function with try/catch. Duplicate code bhi hata. (`services/api.js`)

### 7. Galat time zone (pehle draft mein pakda)
**Wajah:** Server "aaj" UTC se nikaal raha tha. Raat 12 se 5:30 baje IST tak server ka "aaj" kal wala hota.
**Fix:** `utils/clock.js` mein `Asia/Kolkata` ke hisaab se date aur time. Client pe `toISOString()` ki jagah local parts se date string. Dono ke tests hain.

### 8. Jo feature exist nahi karta uska message
**Wajah:** Order ke baad likha tha "My Bookings se prescription upload karo", par upload feature hai hi nahi.
**Fix:** Message badla: "Pharmacist call karke prescription verify karega." UI kabhi woh promise na kare jo app nahi karti.

## Redesign aur deploy ke dauraan mile bugs

### 9. Production mode mein login hi nahi hota tha
**Kya dikha:** Production build ka browser test: register ke baad booking pe "Please log in to continue".
**Wajah:** Production mein cookie `secure: true` tha. express-session plain `http` request pe Secure cookie bhejta hi nahi. Render pe HTTPS hota hai toh wahan chal jaata, lekin locally production test karna namumkin tha.
**Fix:** `secure: 'auto'`. HTTPS request pe cookie Secure, localhost pe normal. curl se `X-Forwarded-Proto: https` bhej ke confirm kiya ki Render pe `Secure` flag lagta hai. (`server/src/app.js`)

### 10. Session khatam hone pe page toota hua dikhta
**Wajah:** Render ka free server restart hote hi memory wale saare sessions chale jaate hain. User ka page logged-in dikhta, par har request 401 deti.
**Fix:** RTK Query ka custom `baseQuery`: kisi bhi request pe 401 aaye toh user ko logged-out mark karo. `ProtectedRoute` khud login page pe bhej deta hai. Test: cookies delete karke tab click kiya, user `/login` pe pahuncha. (`services/api.js`)

### 11. Logout pe kabhi kabhi 401 (do galat theories ke baad sahi diagnosis)
**Pehli theory:** cache reset aur navigation ka order galat hai. Order badla, 401 kam hua par gaya nahi.
**Doosri theory:** React Router navigation ko transition mein chalata hai, purana page mounted rehta hai. Navigation khatam hone ka wait karne wala code likha. Phir bhi 401.
**Asli wajah:** Har request ka timestamp log kiya. Logout akela 6 mein se 6 baar clean tha. 401 sirf tab aata tha jab test page reload hote hi *usi pal* Log out dabata tha: Orders ki request pehle nikal chuki thi, server ne pehle logout process kiya, phir woh request 401 le aayi. Yeh network race hai jo koi frontend rok nahi sakta.
**Fix:** Doosri theory wala complicated code hataya. Personal data wali queries (`useSignedInQueryOptions`) ab sirf known user ke saath chalti hain, aur race wala 401 bug #10 ka handler safely sambhal leta hai. Page load hone ke baad logout: 4 mein se 4 run, zero console errors.
**Seekh:** Andaaze pe fix mat likho. Pehle measure karo.

### 12. Render pe build fail hota
**Wajah:** `NODE_ENV=production` mein `npm install` devDependencies skip karta hai, aur Vite devDependency hai.
**Fix:** Client ke liye `npm install --include=dev`. Fresh copy pe `NODE_ENV=production npm run build && npm start` chala ke verify kiya: home, deep link `/lab-tests`, health check, aur assets pe 1 saal ka cache header.

## Chhote cleanups

- `Modal.jsx`: render ke dauraan `ref.current` assign ho raha tha. React docs isse mana karte hain; ab `useEffect` mein hota hai.
- `doctors.js`: `[...array].sort()` ka copy bekaar tha kyunki `filter()` pehle se naya array deta hai. Galat comment bhi theek kiya.
- `labs.js`: variable ka naam `window` tha. Server pe chalta hai par padhne mein confusing tha; `chosenWindow` kiya.
- Rating `5` ki jagah `5.0` dikhti hai taaki `4.7` ke saath line up ho.
- Status badges ab ek map se label lete hain ("Needs prescription") instead of CSS `text-transform`.
- `cors` package install tha par use nahi hota tha; hata diya.
- Vite config mein `manualChunks` tha jo Vite 8 mein expected chunks nahi bana raha tha. Jo config kaam nahi karta use rakhne se behtar hata dena.
- Lab page pe naya test select karte hi purana "Booked" message hat jaata hai.

## Jo jaan boojh ke nahi badla (aur kyun)

| Cheez | Kyun abhi theek hai | Production mein kya karte |
|---|---|---|
| Session memory mein | Ek server, demo project | Redis session store |
| `db.json` har change pe poora likha jaata hai | 100 users tak koi farak nahi | Postgres / MongoDB |
| Slot double-booking ka check | Node single-threaded hai aur check + insert ek hi synchronous block mein hain, toh beech mein koi doosri request nahi aa sakti | Database unique index `(doctorId, date, time)` |
| Login limiter memory mein | Ek server | Redis counter |
| Client pe pricing ki copy | Sirf dikhane ke liye; server dobara calculate karta hai | Shared package ya API se quote |

## Verification

- Server: 22 tests (availability board bhi) (auth, CSRF guard, rate limit, slot conflict, doosre user ki booking cancel na kar paana, server-side pricing, lab window capacity, IST slot logic)
- Client: 23 tests (cart slice, selectors, date/price formatting, form validation, Modal focus trap aur Escape)
- ESLint: 0 errors
- Browser end-to-end (Playwright), production build pe: register, filter, book, lab booking, cart, order, cancel, logout, session expiry, Back button, mobile width. Har fix ke baad kai baar chalaya; final 4 runs mein console errors zero.
- Render jaisa clean production build aur start, fresh copy pe.
