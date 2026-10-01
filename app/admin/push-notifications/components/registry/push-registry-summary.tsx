export function PushRegistrySummaryCard({ label, value, helper, }: {
    label: string;
    value: string;
    helper?: string;
}) {
    return (<section style={{ padding: 16, borderRadius: 1 }} className="rounded-xl border bg-white p-4">
			<p>
				{label}
			</p>
			<h2 className="text-lg font-semibold">
				{value}
			</h2>
			{helper ? (<p>
					{helper}
				</p>) : null}
		</section>);
}
