import { useRouter, type NextRouter } from "next/router";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import LoadingCenter from "~/components/svgs/Loading";
import Head from "next/head";
import Navbar from "~/components/Navbar";
import { type Table, type Network, type Project } from "~/lib/types";
import TableModel from "~/components/TableModel";
import { ObjectState } from "~/lib/state";
import NetworkModel from "~/components/NetworkModel";
import { genId } from "~/lib/crypto";
import PlusSVG from "~/components/svgs/Plus";

/**
 * Project page
 * @returns {JSX.Element} JSX.Element
 */
export default function ProjectPage(): JSX.Element {
  /**
   * Get the users session to check if they're logged in.
   * @type {Session | undefined}
   * @returns {Session | undefined}
   */
  const { data: session, status } = useSession();

  /**
   * Next router for redirecting to the login endpoint if the
   * user isn't logged in.
   */
  const router: NextRouter = useRouter();

  /**
   * The project data
   */
  const project = new ObjectState<Project>({} as Project);
  const { data, refetch: getProject } = api.projects.getOne.useQuery(
    {
      secret: session?.user.secret ?? "",
      id: router.query.id as string,
    },
    {
      enabled: false,
      refetchOnWindowFocus: false,
    },
  );

  /**
   * Update the project settings
   */
  const { refetch: _updateProject } = api.projects.updateOne.useQuery(
    {
      secret: session?.user.secret ?? "",
      id: router.query.id as string,
      project: {
        ...project.value,
      },
    },
    {
      enabled: false,
      refetchOnWindowFocus: false,
    },
  );

  /**
   * Store the networks
   */
  const activeNetwork = new ObjectState<Network>({} as Network);

  // If the user isn't logged in, redirect to the login page
  if (status === "unauthenticated") {
    router.push("/login?redirect=/projects").catch((e) => console.log(e));
    return <LoadingCenter />;
  }

  // If the user is logged in, get the projects
  if (status === "authenticated") {
    // Verify states and data
    if (!session?.user.secret) return <></>;
    if (!project.updated || !data?.result) {
      getProject().then((res) => {
        if (!res.data?.result) return;

        project.set(res.data.result);
        activeNetwork.set(res.data.result.networks[0] ?? ({} as Network));
      });

      return <LoadingCenter />;
    }

    // Return the jsx
    return (
      <>
        <Head>
          <title>{data.result.name} | arcai</title>
        </Head>

        <Navbar />

        <main className="flex min-h-screen flex-col gap-7 p-14 pt-52">
          {/* Project title and description */}
          <div className="text-center">
            <h1 className="text-6xl font-black">{data.result.name}</h1>
            <p className="mt-2 text-2xl font-thin">{data.result.description}</p>
          </div>

          {/* Map the networks */}
          {project.value.networks?.map((network: Network) => {
            return (
              <NetworkModel
                key={network.id}
                project={project}
                network={network}
                activeNetwork={activeNetwork}
              />
            );
          })}

          {/* Map the tables */}
          {data.result.tables?.map((table: Table) => {
            return (
              <TableModel
                key={table.id}
                headers={table.headers}
                values={table.values}
                layers={activeNetwork.value.layers}
                table={table}
              />
            );
          })}

          {/* Create a new table  or network dropdown */}
          <div className="flex w-full flex-row gap-2">
            <CreateNewTableButton />
            <CreateNewNetworkButton project={project} />
          </div>
        </main>
      </>
    );
  }

  // If the user isn't logged in, return a loading component
  return <LoadingCenter />;
}

/**
 * Create a new table button
 * @param {Object} props Props
 * @returns {JSX.Element} JSX.Element
 */
function CreateNewTableButton(props: {}): JSX.Element {
  return (
    <button
      className="flex w-full flex-row items-center justify-center gap-2 rounded-md border-2 border-slate-100 bg-white px-14 py-5 text-base font-normal tracking-wider text-slate-950 hover:bg-slate-50"
      onClick={async () => {
        return;
      }}
    >
      <PlusSVG className="fill-slate-950" /> <p>Create a new table</p>
    </button>
  );
}

/**
 * Create a new network button
 * @param {Object} props Props
 * @returns {JSX.Element} JSX.Element
 */
function CreateNewNetworkButton(props: {
  project: ObjectState<Project>;
}): JSX.Element {
  return (
    <button
      className="flex w-full flex-row items-center justify-center gap-2 rounded-md border-2 border-slate-100 bg-white px-14 py-5 text-base font-normal tracking-wider text-slate-950 hover:bg-slate-50"
      onClick={async () => {
        const networkId: string = await genId();
        const newNetwork: Network = {
          id: networkId,
          name: "New Network",
          description: "New Network",
          layers: [
            {
              id: await genId(),
              type: "dense",
              neurons: 1,
              shape: 1,
            },
          ],
        };

        props.project.set({
          ...props.project.value,
          networks: [...props.project.value.networks, newNetwork],
        });
      }}
    >
      <PlusSVG className="fill-slate-950" /> <p>Create a new network</p>
    </button>
  );
}
