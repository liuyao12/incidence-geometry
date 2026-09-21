"""Select a surface face through the real canvas keyboard controls."""

def select_surface_face(page, face: int) -> None:
    if not isinstance(face, int) or face < 0:
        raise ValueError("Face index must be a nonnegative integer")
    canvas = page.locator("#net-topology")
    canvas.scroll_into_view_if_needed()
    canvas.focus()
    canvas.press("Home")
    for _ in range(face):
        canvas.press("PageDown")
    page.wait_for_function("f => conicSurface.state.face === f", arg=face)
    page.wait_for_timeout(40)
