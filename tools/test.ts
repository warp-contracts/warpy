async function main() {
  let response;
  try {
    response = await fetch(`https://dre-warpy.warp.cc/warpy/user-balance?userId=1000771508739772557`).then((res) => {
      return res.json();
    });
  } catch (e) {
    console.log(e);
    return;
  }

  console.log(response[0].balance);
}

main().catch((e) => console.error);
