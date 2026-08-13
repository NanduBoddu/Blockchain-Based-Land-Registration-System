function LandingPage({
  theme,
  onToggleTheme,
  onSignIn,
  onSignUp,
}) {
  return (
    <div className="app">

      <nav className="navbar">

        <div className="logo">
          <div className="logo-icon">
            ⬢
          </div>

          <span>
            BoundaryGraph
          </span>
        </div>


        <div className="navbar-right">

          <div className="network-badge">
            ● Algorand TestNet
          </div>

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={
              onToggleTheme
            }
            title={
              theme === "dark"
                ? "Switch to Light Theme"
                : "Switch to Dark Theme"
            }
          >
            {theme === "dark"
              ? "☀️ Light"
              : "🌙 Dark"}
          </button>


          <button
            type="button"
            className="action-btn secondary-btn"
            onClick={onSignIn}
          >
            Sign In
          </button>

          <button
            type="button"
            className="action-btn primary-btn"
            onClick={onSignUp}
          >
            Sign Up
          </button>

        </div>

      </nav>


      <section
        className="hero"
        style={{
          paddingBottom:
            "38px",
        }}
      >

        <p
          style={{
            fontWeight:
              700,
            letterSpacing:
              "0.08em",
            textTransform:
              "uppercase",
          }}
        >
          Algorand-powered land security
        </p>

        <h1>
          Decentralized Smart
          <br />

          <span className="hero-highlight">
            Land Registration
          </span>
        </h1>

        <p>
          LandRegistration System with Blockchain provides a secure,
          transparent and tamper-resistant
          land registry where ownership,
          verification and neighbouring
          boundary relationships are recorded
          on Algorand TestNet.
        </p>

      </section>


      <main className="dashboard">

        <div className="info-panel">

          <div className="info-box">
            <h3>
              🏠 Immutable Land Records
            </h3>

            <p>
              Registered parcel details,
              owners and verification status
              are stored through the
              LandRegistry smart contract.
            </p>
          </div>


          <div className="info-box">
            <h3>
              🔗 Boundary Graph
            </h3>

            <p>
              Land parcels can be linked to
              neighbouring parcels with
              immutable boundary references
              and Government verification.
            </p>
          </div>


          <div className="info-box">
            <h3>
              👤 Public Verification
            </h3>

            <p>
              Public users can verify land
              details, ownership history,
              boundary information, QR proof
              and blockchain evidence.
            </p>
          </div>


          <div className="info-box">
            <h3>
              🏛 Government Control
            </h3>

            <p>
              Registration, verification,
              ownership transfer and access
              approval remain protected by
              on-chain Government
              authorization.
            </p>
          </div>

        </div>


        <div
          className="actions-card"
          style={{
            marginTop:
              "24px",
            textAlign:
              "center",
          }}
        >
          <h2>
            Start Using LandRegistration System
          </h2>

          <p>
            Existing user? Sign in.
            New user? Create an account and
            choose Public or Government role.
          </p>

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "center",
              gap:
                "12px",
              flexWrap:
                "wrap",
            }}
          >
            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={onSignIn}
            >
              Sign In
            </button>

            <button
              type="button"
              className="action-btn primary-btn"
              onClick={onSignUp}
            >
              Sign Up
            </button>
          </div>
        </div>

      </main>


      <footer className="footer">
        LandRegistration System with Blockchain • Decentralized Smart Land
        Registration • Powered by Algorand TestNet
      </footer>

    </div>
  )
}


export default LandingPage