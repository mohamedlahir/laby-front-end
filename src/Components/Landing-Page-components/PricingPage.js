// import * as React from "react";
// import Box from "@mui/material/Box";
// import Button from "@mui/material/Button";
// import Typography from "@mui/material/Typography";
// import { AppProvider } from "@toolpad/core/AppProvider";
// import { useTheme } from "@mui/material/styles";
// import { Link } from "react-router-dom";
// import "./Login.css";

// const pricingPlans = [
//   {
//     name: "Starter",
//     price: "₹30",
//     period: "/user/month",
//     badge: "Simple entry plan",
//     features: [
//       "Academic year timetable setup",
//       "Tutor and class timetable views",
//       "Principal summary dashboard",
//       "Email support",
//     ],
//   },
//   {
//     name: "Growth",
//     price: "₹30",
//     period: "/user/month",
//     badge: "Most popular",
//     featured: true,
//     features: [
//       "Everything in Starter",
//       "Priority onboarding support",
//       "Advanced workload visibility",
//       "Operational guidance for school teams",
//     ],
//   },
//   {
//     name: "Enterprise",
//     price: "Custom",
//     period: "",
//     badge: "For larger institutions",
//     features: [
//       "Volume-based institutional pricing",
//       "Everything in Growth",
//       "Priority support",
//       "Deployment and integration guidance",
//     ],
//   },
// ];

// export default function PricingPage() {
//   const theme = useTheme();

//   return (
//     <AppProvider theme={theme}>
//       <Box className="login-shell pricing-shell">
//         <Box className="login-backdrop-orb login-backdrop-orb--one" />
//         <Box className="login-backdrop-orb login-backdrop-orb--two" />

//         <Box className="public-topbar">
//           <Link to="/" className="public-brand">
//             <span className="public-brand__script">Laby</span>
//           </Link>

//           <Box className="public-nav">
//             <Link to="/" className="public-nav__link">
//               Sign in
//             </Link>
//             <Link to="/register" className="public-nav__link public-nav__link--outline">
//               Register
//             </Link>
//           </Box>
//         </Box>

//         <Box className="pricing-page">
//           <Box className="pricing-hero">
//             <Typography className="pricing-kicker">Pricing</Typography>
//             <Typography className="pricing-title">
//               Simple plans for calmer school scheduling.
//             </Typography>
//             <Typography className="pricing-copy">
//               Choose a Laby plan that fits your school today, with room to grow as
//               your timetable operations become more ambitious. Standard pricing is
//               kept simple at <strong>₹30 per user / month</strong>.
//             </Typography>
//           </Box>

//           <Box className="pricing-grid">
//             {pricingPlans.map((plan) => (
//               <Box
//                 key={plan.name}
//                 className={`pricing-card ${plan.featured ? "pricing-card--featured" : ""}`}
//               >
//                 <Typography className="pricing-card__badge">{plan.badge}</Typography>
//                 <Typography className="pricing-card__title">{plan.name}</Typography>
//                 <Box className="pricing-card__priceRow">
//                   <Typography className="pricing-card__price">{plan.price}</Typography>
//                   {plan.period ? (
//                     <Typography className="pricing-card__period">{plan.period}</Typography>
//                   ) : null}
//                 </Box>

//                 <Box className="pricing-card__features">
//                   {plan.features.map((feature) => (
//                     <Typography key={feature} className="pricing-card__feature">
//                       {feature}
//                     </Typography>
//                   ))}
//                 </Box>

//                 <Button
//                   component={Link}
//                   to="/register"
//                   variant={plan.featured ? "contained" : "outlined"}
//                   className={`pricing-card__button ${
//                     plan.featured ? "pricing-card__button--featured" : ""
//                   }`}
//                 >
//                   {plan.name === "Enterprise" ? "Talk to us" : "Get started"}
//                 </Button>
//               </Box>
//             ))}
//           </Box>
//         </Box>
//       </Box>
//     </AppProvider>
//   );
// }
