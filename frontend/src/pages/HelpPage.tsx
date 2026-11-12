/** Static page. Exists in every variant to keep the page count comparable (PROTOCOL.md §2). */
export default function HelpPage() {
  return (
    <section aria-labelledby="help-heading">
      <h1 id="help-heading">도움말</h1>
      <h2>과제 완료 처리</h2>
      <p>과제 목록에서 과제 오른쪽의 완료 체크박스를 선택하면 완료로, 다시 해제하면 미완료로 바뀝니다.</p>
      <h2>상태 필터</h2>
      <p>상태 필터에서 전체, 미완료, 완료 중 하나를 고르면 해당 상태의 과제만 볼 수 있습니다.</p>
    </section>
  )
}
