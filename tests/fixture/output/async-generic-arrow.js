
// Simple case
const a = async   (v   ) => {};
//             ^^^  ^^^

// Hard case - generic spans multiple lines
const b = async (
     
 /**/ /**/v   ) => {};
//   ^     ^^^

// Harder case - generic and return type spans multiple lines
const c = async (
     
  v              
                 
     
) => v;
